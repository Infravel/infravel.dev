# Homepage refinement review

21 October 2026. Local work on `staging`; no commit, push, deployment, production modification, DNS change, Pages change, or Coming Soon modification.

## Changes

- `src/components/brand-logo.tsx`: wraps the unchanged approved WebP in an aspect-ratio frame. It displays the source window x=40–960, y=20–530, removing only the outer background gutters. A 2% edge mask softens the remaining gutter against navy. The approved ribbon and lettering remain within the fully opaque area, without stretching, recoloring, redrawing, or image re-encoding. The same component also keeps the footer consistent.
- `src/app/globals.css`: navigation logo frames increase from a 160px-wide original image to a 180px-wide tighter frame on desktop, and from 136px to a 156px frame on mobile. Because of the tighter frame, the artwork renders about 22% larger on desktop and 25% larger on mobile. Header height increases by only 8px and 12px respectively. Mobile navigation offsets follow the new header height.
- Hero columns align at the top. The homepage logo frame is 224px wide instead of the earlier 320px image, with a 16px gap to the existing diagram instead of 28px. Desktop top/bottom spacing is reduced; phone layouts retain their readable stacked content. Tablet diagram padding/gaps are tightened so Commit, Validate, Deploy, Linux, Docker, and Kubernetes do not split across lines.
- `tests/e2e/branding.spec.ts`: updates the hero image locator for the frame; checks that diagram labels remain whole at every target width; delays image delivery to verify that header/hero positions and sizes do not shift when the logo loads.

The existing headline, copy, CTAs, navy/cyan tokens, diagram nodes/connectors, services, forms, notification behavior, SEO metadata, favicon, and social preview artwork are preserved. No new asset, font, dependency, image service, or external request was added to the website.

## Artwork and loading

`public/brand/infravel-lockup.webp` remains the exact supplied 21,558-byte file, SHA-256 `b4850972fa1acca75d85397a85d8cbbff584582c7896a7165eeb9fa4330d13ce`. The source asset package is untouched.

The backdrop is baked into the supplied artwork. This change removes presentation gutters and softens their boundary; it does **not** claim complete background removal or a transparent source. Removing the remaining backdrop safely would require an owner-supplied transparent master. The full unmodified image remains available, and its symbol/lettering are not substituted or reconstructed.

The frame reserves its 920:510 aspect ratio before the image arrives. The underlying image retains its intrinsic 1000:550 ratio. The header eagerly loads the existing small WebP at high priority; the hero/footer reuse the same URL and cached response. The delayed-download browser check confirms identical positions/sizes for the header frame, headline, hero frame, and architecture card before and after image decoding. This is a focused image-layout stability check, not a field Core Web Vitals measurement.

## Screenshots

All screenshots use the local production build, a 1000px-high viewport, loaded Geist fonts, and the approved image. The complete mobile hero capture extends the viewport to include the entire hero. They are review artifacts only and are not served in the website's public assets.

| Viewport | Before | After |
| --- | --- | --- |
| 360px | [Before](before-360.png) | [After](after-360.png) |
| 390px | [Before](before-390.png) | [After](after-390.png) |
| 768px tablet | [Before](before-768.png) | [After](after-768.png) |
| 1024px | [Before](before-1024.png) | [After](after-1024.png) |
| 1440px desktop | [Before](before-1440.png) | [After](after-1440.png) |

- [Complete mobile header and hero](after-390-hero.png)
- [Open mobile navigation](after-mobile-menu.png)

Measurements come from browser bounding boxes; unrounded values are retained in [before metrics](before-metrics.json) and [after metrics](after-metrics.json).

| Width | Before hero height | After hero height | Reduction |
| --- | --- | --- | --- |
| 360px | 1605px | 1532px | 73px |
| 390px | 1532px | 1457px | 75px |
| 768px | 1060px | 881px | 179px |
| 1024px | 908px | 774px | 134px |
| 1440px | 908px | 794px | 114px |

At 1440px, the headline starts at y=222px instead of y=362px, removing roughly 140px of empty space above the headline. The header occupies 113px including its border, versus 105px before; mobile is 101px versus 89px. These figures describe local screenshot conditions, not a universal layout guarantee.

## Verification

- Lint: passed.
- TypeScript: passed, including the final browser-test changes.
- Unit/integration tests: all 66 passed across 5 files. No live emails or external form submissions.
- Next.js production build: passed, including all 30 static generation tasks.
- OpenNext Worker build: passed, including the generated Worker manifest regression check.
- Full Playwright suite: all 22 desktop/mobile tests passed. After screenshot review prompted the small tablet padding adjustment, all 8 affected branding, layout-stability, homepage accessibility, and route-wide responsive/accessibility tests passed again against the final production build. Unaffected form/navigation tests were not unnecessarily repeated.
- All 18 marketing routes: no horizontal page overflow at 360, 390, 768, 1024, and 1440px; zero axe violations at 360/1440px using WCAG 2 A/AA, 2.1 AA, and 2.2 AA tags. Diagram label checks cover all five widths.
- Desktop, tablet, mobile, complete mobile hero, and mobile-menu screenshot review: completed.
- Asset identity: approved logo SHA-256 unchanged. Git whitespace check: passed.

Existing Vite module-format, experimental SQLite, and OpenNext Windows compatibility advisories are unchanged. No real Safari/iOS device, remote Worker runtime, field performance measurement, or production launch validation is claimed. Earlier production-configuration and legal-review prerequisites in [the branding report](../branding-integration.md) remain outside this visual refinement.
