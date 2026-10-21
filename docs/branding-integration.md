# Final Infravel branding integration

Local implementation on `staging`, 21 October 2026. No commit, push, deployment, migration, Cloudflare Pages change, DNS change, secret update, or modification to the existing Coming Soon source was performed. Earlier UI and notification work is retained.

## Approved source and artwork preservation

The owner supplied `infravel-logo-assets.zip` and its extracted `infravel-logo-assets/infravel-logo-assets/` directory. The package contains a PNG original, two WebP logo compositions, two PNG symbol sizes, and a prepared PNG favicon. There is no SVG or transparent/light-background variant. None has been invented or traced.

The full artwork, custom lettering, ribbon symbol, colors, and baked-in dark backdrop are preserved. Header, mobile navigation, footer, and homepage use the complete lockup without cropping, filters, recoloring, or stretching. The image remains legible on its supplied dark panel, including beside lighter website sections. No recreation with CSS/text or third-party design elements is used.

| Published asset | Source / preparation | Dimensions | Size |
| --- | --- | --- | --- |
| `/brand/infravel-lockup.webp` | Exact copy of supplied lockup | 1000 × 550 | 21,558 bytes |
| `/brand/infravel-full.webp` | Exact copy of supplied full composition | 1200 × 600 | 17,678 bytes |
| `/brand/infravel-symbol-192.png` | Exact copy of supplied symbol | 192 × 192 | 36,958 bytes |
| `/brand/infravel-symbol-512.png` | Exact copy of supplied symbol; organization schema logo | 512 × 512 | 216,212 bytes |
| `/icon.png` | Exact supplied favicon PNG | 64 × 64 | 5,653 bytes |
| `/favicon.ico` | PNG frames proportionally reduced from supplied favicon | 16, 32, 64 | Multi-resolution ICO |
| `/apple-icon.png` | Proportional downsample of supplied 512px symbol | 180 × 180 | 49,288 bytes |
| `/opengraph-image.jpg` | Supplied full composition plus 15px top/bottom navy padding; JPEG encoding | 1200 × 630 | 37,500 bytes |

Source-preservation SHA-256 references:

- Lockup: `b4850972fa1acca75d85397a85d8cbbff584582c7896a7165eeb9fa4330d13ce`
- Full composition: `9155b4bf0ba5ce762b152f4e189a1d9f8451af494afcffab75dbac19eb3b73a7`
- Prepared favicon: `da11b3cd4e9ccef2feb94f2e1378324ef540f1493e31f798cbab82d1727ddee6`

`node scripts/prepare-brand-assets.mjs` reproduces the published assets from the supplied directory; an alternative source directory can be passed as the first argument. It uses the installed Sharp library already present with Next.js. It performs only file copying, proportional resizing, padding, encoding, and ICO packaging. The owner package remains untouched and is not served publicly. No dependencies were added.

## Modified files and public placements

- `src/components/brand-logo.tsx`: shared accessible Next Image component with intrinsic 1000:550 dimensions. It serves the existing optimized WebP directly, avoiding reliance on a runtime image transformation service or new Cloudflare binding. The header eagerly loads the 22KB image; other occurrences reuse its cached URL.
- `src/components/layout.tsx`: replaces both temporary text logos and the header glyph with the approved artwork. Home links retain the accessible name “Infravel home.” The mobile menu retains its existing keyboard and Escape behavior.
- `src/app/page.tsx`: displays the complete lockup with the existing delivery architecture; business copy and calls to action are unchanged.
- `src/app/globals.css`: proportionate image dimensions, header spacing, homepage logo positioning, and mobile menu offset. Desktop navigation uses a 160 × 88px lockup; mobile uses 136 × 74.8px. No opaque artwork is falsely presented as transparent.
- `src/app/layout.tsx` and `src/lib/seo.ts`: approved social image, Twitter card, image descriptions, and organization logo metadata. Existing canonicals, titles, descriptions, structured data, and staging indexing controls are preserved.
- `src/app/icon.svg` and `src/app/opengraph-image.tsx`: removed temporary generated artwork. Replaced by static `icon.png`, `favicon.ico`, `apple-icon.png`, `opengraph-image.jpg`, and its alt-text file using Next.js file conventions. The static social image requires no runtime image generation.
- `public/brand/*` and `scripts/prepare-brand-assets.mjs`: published artwork and deterministic preparation.
- `tests/e2e/branding.spec.ts` and `tests/e2e/site.spec.ts`: branding, image decoding/dimensions, metadata/asset URLs, mobile menu position/focus, and shared-logo assertions on every marketing route.

All 18 Next.js marketing routes were reviewed through browser checks: Home, Services, six service details, About, Work, OpsPilot, Contact, Insights, three article details, Privacy, and Terms. Shared header/footer artwork replaces placeholder Infravel branding throughout these pages. The legacy root static HTML/CSS and its old deployment remain untouched, as required. The existing email templates are separate from the public website and were not changed in this branding task.

## Verification

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: 66 unit/integration tests passed across 5 files; provider requests remain mocked.
- `npm run build`: passed; 30 static generation tasks completed, including icon/social image routes.
- `npm run build:worker`: passed, including the Worker manifest regression check. OpenNext emitted its existing Windows compatibility advisory; live Worker runtime behavior was not tested.
- Playwright: all 20 desktop/mobile tests passed against the local production build at `http://127.0.0.1:3100`. A pre-existing development-server conflict prevented the first harness startup; no development process was killed. The separate production server was stopped after testing.
- All 18 routes: no horizontal page overflow at 360, 390, 768, 1024, or 1440px; zero automated axe violations at 360 and 1440px. Header/footer use the exact approved lockup URL throughout.
- Logo aspect ratio, actual image decoding, correct 64px/180px/1200×630px assets, social metadata, organization logo schema, mobile navigation position, Escape dismissal, and focus restoration passed.
- Desktop and 390px homepage/footer screenshots were captured locally; homepage and desktop footer screenshots were visually reviewed. Screenshot artifacts are under ignored `test-results/`. No field Core Web Vitals, remote social crawler, Safari/iOS home-screen, or live Cloudflare runtime verification is claimed.
- Whitespace check: passed. All four published source-copy assets and the favicon PNG match their owner-supplied originals byte-for-byte.

## Production readiness and owner review

Branding is ready for owner review. A vector/transparent variant would be useful if future layouts require a background-free logo, but is not required for this integration. The supplied small favicon remains the approved detailed ribbon artwork; visual review in actual browser chrome and iOS remains useful before launch.

The following are existing launch prerequisites, not changes made by this task:

1. `wrangler.jsonc` still uses an all-zero placeholder production D1 database ID. Real production resources must be prepared separately through an approved rollout.
2. Local public-variable presence checks found the Turnstile site key present, but public contact email, founder name, booking URL, analytics token, and `DEPLOYMENT_ENV` absent. Missing optional founder/booking/analytics values are supported. Confirm the business contact details and set production build/runtime indexing mode for an eventual production artifact. Local absence does not establish the state of remote environment variables.
3. `.dev.vars` is absent locally. Remote Brevo sender authorization, recipient configuration, secrets, Turnstile hostname/action configuration, D1 migrations, and notification scheduling were not inspected or modified. Prior task migration `0002_waitlist_notifications.sql` must be confirmed applied in the intended target before its notification code is deployed; this task does not establish remote migration state.
4. Privacy and Terms remain labeled drafts requiring business/legal review. Public contact, contracting identity, retention, consent, and commercial copy need the existing owner launch review.
5. Complete the existing Linux Worker runtime/CI and live staging integration checks, performance measurement, dependency-advisory review, backup/rollback preparation, and explicit cutover approval in `docs/launch-checklist.md` before production. Historical performance reports are not new measurements.

No remote service or resource was changed to resolve these prerequisites. `main`, the existing Coming Soon website, Cloudflare Pages, DNS, and GitHub workflows remain untouched.
