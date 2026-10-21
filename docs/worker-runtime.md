# Staging Worker initialization crash (18 October 2026)

## Cause and compatibility

Next.js 16.4.1 calls `NextNodeServer.getPreviewProps()` during server initialization. It now reads `.next/server/preview-props.json`, which contains the actual preview/draft-mode keys, separately from the prerender manifest.

OpenNext Cloudflare 1.20.11's `dist/cli/build/patches/plugins/load-manifest.js` scans `**/{*-manifest,required-server-files,prefetch-hints}.json` and replaces Next's filesystem loader with an inlined dispatch function. That glob excludes preview-props. The generated `.open-next/server-functions/default/handler.mjs` therefore throws for this required manifest even though both source and copied files exist. Build and upload success cannot establish runtime initialization success. This explains the reported error 1101; it is independent of D1, Turnstile, Brevo, DNS, or environment-secret values.

The old package peer range allowed Next 16.4.1, but its manifest handling was incomplete. Upstream [issue #1355](https://github.com/opennextjs/opennextjs-cloudflare/issues/1355) and [fix #1356](https://github.com/opennextjs/opennextjs-cloudflare/pull/1356) describe the same failure. The [1.20.12 release](https://github.com/opennextjs/opennextjs-cloudflare/releases/tag/%40opennextjs%2Fcloudflare%401.20.12) includes that fix plus OpenNext AWS 4.1.11 with Next 16.4 support. The installed upgraded package explicitly includes `server/preview-props.json`; its peer range is `>=15.5.28 <16 || >=16.4.1`, and Wrangler's range is `^4.148.0`.

## Change

Pin `@opennextjs/cloudflare` to 1.20.12 in package.json and package-lock.json; this updates only the adapter and its pinned AWS implementation (4.1.10 to 4.1.11). Keep Next 16.4.1, Wrangler 4.151.0, React, application code, OpenNext configuration, Wrangler bindings, and GitHub Actions configuration unchanged. A framework downgrade or local dependency patch is unnecessary because the upstream patch is released. Do not return `{}` for this manifest: it holds required draft-mode data.

`npm run build:worker` now runs `npm run check:worker` after bundling. The check parses the actual generated handler with the existing TypeScript dependency, isolates every patched loadManifest function, executes it against `/.next/server/preview-props.json`, and compares the result with the source and copied manifests. It fails if the handler lacks a loader, throws, returns an empty fallback, or returns different keys. It never prints manifest values or assertion diffs. It reads generated files; it does not change them. Builds through the existing GitHub Actions command inherit this check without workflow edits. Calling the raw OpenNext CLI directly bypasses the npm check.

The upgraded generated loader returned the correct props. In a separate in-memory negative control, removing only its preview-props dispatch branch reproduced the exact reported exception; no generated file was edited. The check supplies Next's module-level sharedCache default when executing the isolated loader. A broad string search is insufficient because the bundle also contains Next's call site for preview-props; the regression must execute the loader itself.

## Local verification

Node 22.15.1 verification: lint and TypeScript checks passed; all 34 unit/integration tests passed; the standalone Next.js production build passed. `npm run build:worker` passed, including the final generated-loader regression check. The negative control reproduced the exact exception. Windows bundle checks do not establish Linux workerd execution or successful remote delivery/persistence. No deployment, push, main-branch modification, remote database operation, resource change, or secret change is part of this fix.

## Exact Ubuntu GitHub Actions verification (no deployment)

Use a separate validation job/workflow checked out at the proposed **staging commit**, with `runs-on: ubuntu-latest`, `permissions: { contents: read }`, `actions/checkout@v4` (`ref: staging`, or preferably the exact reviewed staging SHA), and `actions/setup-node@v4` (`node-version: "22"`, `cache: npm`). Do not run the existing deploy workflow merely to validate: it includes remote migration/deployment commands. Do not supply Cloudflare account credentials or real email/Turnstile secrets to this validation job. Its commands are:

```bash
set -euo pipefail
test "$(git branch --show-current)" = staging # omit only when checkout pins a detached staging SHA
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run build:worker # includes the manifest regression check

# Local workerd only. No --remote, migration, or deploy command.
# No .dev.vars should be copied into this clean CI checkout.
WRANGLER_SEND_METRICS=false npx wrangler dev --local --ip 127.0.0.1 --port 8787 --log-level error > /tmp/infravel-worker.log 2>&1 &
worker_pid=$!
trap 'kill "$worker_pid" 2>/dev/null || true' EXIT
ready=false
for attempt in $(seq 1 60); do
  if curl --silent --fail http://127.0.0.1:8787/ >/dev/null; then
    ready=true
    break
  fi
  kill -0 "$worker_pid" 2>/dev/null || break
  sleep 1
done
test "$ready" = true
for path in / /services /contact; do
  status=$(curl --silent --output /dev/null --write-out '%{http_code}' "http://127.0.0.1:8787$path")
  test "$status" = 200
done
test "$(curl --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1:8787/does-not-exist)" = 404
test "$(curl --silent --output /dev/null --write-out '%{http_code}' -X POST http://127.0.0.1:8787/api/internal/notifications/retry)" = 401
# Fail without echoing logs that could contain runtime data.
if grep -Eq 'Unexpected loadManifest|Unexpected evalManifest' /tmp/infravel-worker.log; then
  exit 1
fi
```

Require both the build regression check and these local workerd requests to pass. `/contact` exercises dynamic server initialization; an asset-only request is insufficient. This procedure needs no remote D1 access and sends no transactional email. It does not test authenticated retry or real lead persistence.

After a separately authorized staging deployment, verify the actual staging hostname, a dynamic page, a 404, unauthenticated retry rejection, and absence of initialization exceptions in private Worker logs. Then exercise existing staging D1/Turnstile/Brevo integrations through the established staging checklist. Production Coming Soon resources remain untouched.
