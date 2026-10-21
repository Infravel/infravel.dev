import fs from "node:fs";
import yaml from "js-yaml";
const draft = ".github/workflows/production-launch.yml.disabled";
try {
  const workflow = yaml.load(fs.readFileSync(draft, "utf8"));
  const job = workflow.jobs.release;
  if (
    Object.keys(workflow.on).join() !== "workflow_dispatch" ||
    workflow.permissions?.contents !== "read" ||
    job.environment !== "production" ||
    !job.if.includes("refs/heads/staging") ||
    !job.if.includes("ENABLE_PRODUCTION_LAUNCH") ||
    workflow.concurrency.cancel_in_progress === true ||
    workflow.concurrency["cancel-in-progress"] !== false
  )
    throw new Error();
  const steps = job.steps;
  if (
    steps
      .filter((step) => step.uses)
      .some((step) => !/@[a-f0-9]{40}$/.test(step.uses))
  )
    throw new Error();
  const commands = steps.map((step) => step.run || "").join("\n");
  if (
    !commands.includes("npm audit --audit-level=high") ||
    !commands.includes("check-production.mjs") ||
    /wrangler pages|secret put|secret bulk|--env production|git push/i.test(
      commands,
    )
  )
    throw new Error();
  for (const file of fs.readdirSync(".github/workflows")) {
    if (/production.*\.ya?ml$/i.test(file) && file !== "production-release.yml")
      throw new Error();
  }
  const activeMain = ".github/workflows/production-release.yml";
  const mainDraft = `${activeMain}.disabled`;
  if (fs.existsSync(activeMain) && fs.existsSync(mainDraft)) throw new Error();
  const main = yaml.load(
    fs.readFileSync(fs.existsSync(activeMain) ? activeMain : mainDraft, "utf8"),
  );
  const release = main.jobs.release;
  const mainCommands = release.steps.map((s) => s.run || "").join("\n");
  if (
    Object.keys(main.on).join() !== "workflow_dispatch" ||
    main.permissions?.actions !== "read" ||
    release.environment !== "production" ||
    !release.if.includes("refs/heads/main") ||
    !release.steps.some(
      (s) =>
        s.env?.RELEASE_ENABLED === "${{ vars.ENABLE_PRODUCTION_RELEASE }}" &&
        s.run.includes('test "$RELEASE_ENABLED" = true'),
    ) ||
    !mainCommands.includes("check-production-release.mjs") ||
    !mainCommands.includes("deploy-production-version.mjs") ||
    /migrations apply|d1 execute|triggers deploy|wrangler pages|secret (put|bulk)/i.test(
      mainCommands,
    ) ||
    release.steps
      .filter((s) => s.uses)
      .some((s) => !/@[a-f0-9]{40}$/.test(s.uses))
  )
    throw new Error();
  console.log(
    "Legacy launch draft remains disabled; main release workflow manual approval and target checks verified.",
  );
} catch {
  console.error("Production workflow draft validation failed.");
  process.exitCode = 1;
}
