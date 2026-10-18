# Audit and implementation plan — 15 October 2026

The initial Git working tree was clean. Git was run with command-scoped safe.directory because the sandbox and repository owners differ; global Git configuration was not changed. The original repository contains eight HTML pages, one stylesheet, robots.txt, sitemap.xml, and a Python validator. There was no package manifest, CI, Wrangler configuration, or binding configuration. All original HTML/CSS remains intact. The previous README identifies Cloudflare Pages, automatic deployment from main, and no build command. The actual site has more pages than the supplied “Coming Soon” description.

This is repository evidence, not a live Cloudflare account audit. No Cloudflare credentials were available in the process environment. Dashboard settings, DNS, current deployment IDs, and account ownership have not been inspected. No commit, push, deployment, or DNS change was performed.

Brand retained: Infravel, infrastructure engineering focus, and supplied tagline. The existing work page described a deployment template without a verifiable repository URL. New content presents conceptual reference architectures without client or implemented-result claims.

Plan: (1) preserve production source and establish Next foundation; (2) build all marketing routes and centralized pricing; (3) implement protected D1 submissions and outbox notifications; (4) add OpsPilot, technical articles, legal drafts; (5) run checks, prepare CI and staging, document cutover and rollback.

The registry returned Next 16.4.1 and OpenNext 1.20.11. The adapter declares Next >=15.5.27 <16 or >=16.3.8 and Wrangler ^4.148.0. Installed versions are locked. It uses Workers nodejs_compat, not the deprecated next-on-pages adapter. Ubuntu CI is the reference environment; OpenNext warns Windows support is incomplete.

References: [OpenNext setup](https://opennext.js.org/cloudflare/get-started), [Cloudflare adapter](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/).
