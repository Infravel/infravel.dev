// Read-only remote checks. Never print API objects, tokens or binding values.
export function verifyEnvironment(environment, policies) {
  const review = environment.protection_rules?.find(
    (r) => r.type === "required_reviewers",
  );
  if (
    !review?.reviewers?.length ||
    review.prevent_self_review !== true ||
    environment.can_admins_bypass !== false ||
    environment.deployment_branch_policy?.custom_branch_policies !== true ||
    environment.deployment_branch_policy?.protected_branches !== false ||
    policies.length !== 1 ||
    policies[0].name !== "main" ||
    policies[0].type !== "branch"
  ) {
    throw new Error(
      "Production requires reviewers, no self-review/admin bypass, and only main deployment policy.",
    );
  }
}
export function verifyPages(project) {
  if (project.name !== "infravel-dev")
    throw new Error("Unexpected Pages project.");
  if (project.source === null) return; // A confirmed non-Git project cannot auto-build a Git push.
  const config = project.source?.config;
  if (
    config?.deployments_enabled !== false &&
    config?.production_deployments_enabled !== false
  )
    throw new Error(
      "Pause Pages automatic production deployments before merging or releasing main.",
    );
}
async function get(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "Infravel-release",
    },
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error("Read-only release metadata unavailable; stop.");
  return response.json();
}
import { pathToFileURL } from "node:url";
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    if (process.env.GITHUB_REF !== "refs/heads/main")
      throw new Error("Release requires main.");
    const gh =
      "https://api.github.com/repos/Infravel/infravel.dev/environments/production";
    const env = await get(gh, process.env.GH_TOKEN);
    const policies = await get(
      `${gh}/deployment-branch-policies?per_page=100`,
      process.env.GH_TOKEN,
    );
    if (policies.total_count !== 1)
      throw new Error("Unexpected production branch policies.");
    verifyEnvironment(env, policies.branch_policies);
    const pages = await get(
      "https://api.cloudflare.com/client/v4/accounts/f6d4cc93a61d7012130cfbd39b3a84fd/pages/projects/infravel-dev",
      process.env.CLOUDFLARE_API_TOKEN,
    );
    if (!pages.success) throw new Error("Pages inspection failed.");
    verifyPages(pages.result);
    console.log(
      "Production reviewer/branch controls and Pages automatic-deployment guard verified.",
    );
  } catch (error) {
    console.error(
      error.message?.startsWith("Production requires") ||
        error.message?.startsWith("Pause Pages")
        ? error.message
        : "Production release metadata guard failed; no raw response printed.",
    );
    process.exitCode = 1;
  }
}
