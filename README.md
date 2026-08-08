# infravel.dev
Official static website for Infravel — infrastructure engineering that moves with you.

This repository hosts the Infravel website on Cloudflare Pages with a plain HTML/CSS implementation.

- Production domain: https://infravel.dev
- Hosting: Cloudflare Pages
- Deployment: automatic from `main`
- Static site: no build step required

## Site structure

- `/` — Homepage
- `/services/` — Services overview
- `/services/cicd-deployment-automation/` — CI/CD & Deployment Automation
- `/services/monitoring-observability/` — Monitoring & Observability
- `/work/` — Work / open-source engineering preview
- `/about/` — About Infravel
- `/contact/` — Project assessment form placeholder

## Local preview

From the project root run:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Notes

- The contact form UI is in place, but submissions are not configured in this static site.
- SEO support includes canonical URLs, Open Graph metadata, structured data, robots, and sitemap files.

- Production domain: https://infravel.dev
- Hosted on Cloudflare Pages
- Deploys automatically from the `main` branch
- Built with plain HTML and CSS, no build step required

## Local preview

Open `index.html` directly in a browser, or run a local server from the project root:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.
