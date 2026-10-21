# Local development

Use Node 22.15+ (22 LTS recommended). On Windows use npm.cmd / npx.cmd if PowerShell blocks .ps1 launchers; no execution-policy change is necessary.

```sh
npm ci
cp .env.example .env.local
cp .dev.vars.example .dev.vars
npm run dev
```

Next dev serves the UI. For Cloudflare bindings use `npm run db:migrate` then `npm run preview`. Missing integrations fail safely; there is no server bot-check bypass or fake persistence. Official Turnstile test keys are for local/staging only. See environment.md and turnstile.md.

Service content/prices: src/config/services.ts. Approved business configuration: src/config/site.ts and public environment values. Articles: src/content/insights.ts. Work: src/config/work.ts; repository links and client claims require verification and permission. There is no CMS, authentication, or public lead listing.

Root HTML files are preserved legacy Pages source, not the new app. The old Python validator recursively scans HTML in dependencies; use the new Playwright route/link checks after installing npm packages.
