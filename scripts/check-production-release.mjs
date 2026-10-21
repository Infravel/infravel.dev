// Read-only remote checks. Never print API objects, tokens or binding values.
export const metadataEndpoints = {
  environment: {
    origin: "https://api.github.com",
    path: "/repos/Infravel/infravel.dev/environments/production",
    permission: "GitHub Actions: read",
    credential: "GH_TOKEN",
  },
  policies: {
    origin: "https://api.github.com",
    path: "/repos/Infravel/infravel.dev/environments/production/deployment-branch-policies?per_page=100",
    permission: "GitHub Actions: read",
    credential: "GH_TOKEN",
  },
  pages: {
    origin: "https://api.cloudflare.com/client/v4",
    path: "/accounts/f6d4cc93a61d7012130cfbd39b3a84fd/pages/projects/infravel-dev",
    permission: "Cloudflare account Pages Read (or Pages Write)",
    credential: "CLOUDFLARE_API_TOKEN",
  },
};
class MetadataGuardError extends Error {}
function fail(check, status, detail) {
  throw new MetadataGuardError(
    `[${check}] GET ${metadataEndpoints[check].path} HTTP ${status}: ${detail}`,
  );
}
export function verifyEnvironment(environment, policies) {
  if (!Array.isArray(environment?.protection_rules))
    fail("environment", 200, "missing/invalid field protection_rules");
  const review = environment.protection_rules.find(
    (r) => r?.type === "required_reviewers",
  );
  const checks = [
    [
      review?.reviewers?.length === 1 &&
        review.reviewers[0]?.type === "User" &&
        typeof review.reviewers[0]?.reviewer?.login === "string" &&
        review.reviewers[0].reviewer.login.toLowerCase() === "shekhar396",
      "environment",
      "required_reviewers must specify sole User reviewer shekhar396",
    ],
    [
      typeof review?.prevent_self_review === "boolean",
      "environment",
      "missing/invalid required_reviewers.prevent_self_review (either boolean is permitted for solo founder)",
    ],
    [
      environment.can_admins_bypass === false,
      "environment",
      "can_admins_bypass must be present and false",
    ],
    [
      environment.deployment_branch_policy?.custom_branch_policies === true &&
        environment.deployment_branch_policy?.protected_branches === false,
      "environment",
      "deployment_branch_policy must select custom_branch_policies=true, protected_branches=false",
    ],
    [
      Array.isArray(policies) &&
        policies.length === 1 &&
        policies[0]?.name === "main" &&
        policies[0]?.type === "branch",
      "policies",
      "branch_policies must contain exactly main with type=branch",
    ],
  ];
  for (const [valid, check, detail] of checks)
    if (!valid) fail(check, 200, detail);
}
export function verifyPages(project) {
  if (project?.name !== "infravel-dev")
    fail("pages", 200, "result.name missing or not infravel-dev");
  if (project.source === null) return; // A confirmed non-Git project cannot auto-build a Git push.
  const config = project.source?.config;
  if (
    typeof config?.deployments_enabled !== "boolean" &&
    typeof config?.production_deployments_enabled !== "boolean"
  )
    fail(
      "pages",
      200,
      "missing boolean result.source.config.deployments_enabled or production_deployments_enabled",
    );
  if (
    config?.deployments_enabled !== false &&
    config?.production_deployments_enabled !== false
  )
    fail(
      "pages",
      200,
      "automatic production Git deployments remain enabled; pause them before release",
    );
}
export async function requestMetadata(check, token, fetcher = fetch) {
  const endpoint = metadataEndpoints[check];
  if (!token)
    fail(
      check,
      "not requested",
      `missing ${endpoint.credential}; requires ${endpoint.permission}`,
    );
  let response;
  try {
    response = await fetcher(endpoint.origin + endpoint.path, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Infravel-release",
        Accept: "application/json",
      },
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    fail(
      check,
      "unavailable",
      "network/TLS/timeout/redirect failure; provider details withheld",
    );
  }
  if (!response.ok) {
    let reason = "provider request failed";
    if (response.status === 401)
      reason = `authentication rejected; verify ${endpoint.credential}`;
    if (response.status === 403)
      reason =
        response.headers.get("x-ratelimit-remaining") === "0"
          ? "rate limit exhausted"
          : "access denied; verify token permission and resource scope";
    if (response.status === 404)
      reason =
        "resource not found or token lacks visibility; do not assume absence";
    if (response.status === 429) reason = "provider rate limit; do not bypass";
    await response.body?.cancel().catch(() => {});
    fail(
      check,
      response.status,
      `${reason}; required permission: ${endpoint.permission}`,
    );
  }
  try {
    return await response.json();
  } catch {
    fail(check, response.status, "invalid JSON response; body withheld");
  }
}
export async function checkProductionRelease(
  input,
  { fetcher = fetch, log = console.log } = {},
) {
  if (input.GITHUB_REF !== "refs/heads/main")
    throw new MetadataGuardError(
      "[branch] production release requires refs/heads/main",
    );
  const environment = await requestMetadata(
    "environment",
    input.GH_TOKEN,
    fetcher,
  );
  log("[environment] GET succeeded HTTP 200");
  const policies = await requestMetadata("policies", input.GH_TOKEN, fetcher);
  if (policies?.total_count !== 1)
    fail("policies", 200, "total_count missing or not 1");
  verifyEnvironment(environment, policies.branch_policies);
  log(
    "[policies] HTTP 200; solo-founder reviewer, no admin bypass and main-only policy verified",
  );
  const pages = await requestMetadata(
    "pages",
    input.CLOUDFLARE_API_TOKEN,
    fetcher,
  );
  if (pages?.success !== true)
    fail(
      "pages",
      200,
      "success missing/false; verify account Pages Read permission and project visibility",
    );
  verifyPages(pages.result);
  log("[pages] HTTP 200; automatic production Git deployments disabled");
}
export function safeDiagnostic(error) {
  return error instanceof MetadataGuardError
    ? error.message
    : "[internal] unexpected metadata guard failure; raw error withheld";
}
import { pathToFileURL } from "node:url";
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  checkProductionRelease(process.env).catch((error) => {
    console.error(safeDiagnostic(error));
    process.exitCode = 1;
  });
}
