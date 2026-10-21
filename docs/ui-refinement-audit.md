# Infravel UI refinement audit

Date: 21 October 2026. Local work on `staging`; no commit, push, or deployment.

## Typography and layout

The shared stylesheet previously used 8?13px for navigation, buttons, service descriptions, pricing notes, footer links, and diagram labels. Hero/page headings reached 60?67px, while page-specific overrides created inconsistent scales. Existing Geist is appropriate and remains locally hosted through the existing fontsource imports; no new font family or dependency was added.

The revised system uses 16px body text and form inputs, 14px supporting text and controls, fluid page H1s of 34?48px, hero H1s of 38?60px, H2s of 26?36px, and H3s of 20?24px (at the default 16px root size). Heading tokens use rem-based clamp values to respect text scaling. Service descriptions and legal/article prose use the body scale. Pricing values remain prominent and prices are unchanged.

Existing containers, sections, cards, and page composition are retained. Grid tracks now allow content to shrink without forcing overflow. Three-column cards become single-column on narrow screens; process steps become two columns on tablets and one on phones. Small quote controls, menu toggles, and service arrow links have at least 44px targets. Form inputs have a minimum height of 48px. Dark hero gradients, diagram perspective, and the large diagram shadow were removed for a calmer presentation.

## Color palette and contrast

These colors refine the existing navy/cyan identity provisionally. They are **not** claimed to be sampled from an approved logo: that asset was not found. CSS variables are centralized in `src/app/globals.css`; brand, brand-ink, ink, muted, and canvas are also exposed through Tailwind's inline theme.

Ratios below use WCAG relative luminance: linearize each sRGB channel at 0.04045, calculate luminance with coefficients 0.2126/0.7152/0.0722, then divide (lighter + 0.05) by (darker + 0.05). Values are rounded to two decimals.

| Role / foreground | Background | Ratio |
| --- | --- | --- |
| Ink `#14263d` | White `#ffffff` | 15.28:1 |
| Muted `#526277` | White `#ffffff` | 6.23:1 |
| Muted `#526277` | Pale `#f4f7fa` | 5.79:1 |
| Link/accent ink `#086b7c` | White `#ffffff` | 6.17:1 |
| Link/accent ink `#086b7c` | Pale `#f4f7fa` | 5.74:1 |
| On-dark `#f8fafc` | Navy `#0b1220` | 17.89:1 |
| Muted-dark `#aebcd0` | Navy `#0b1220` | 9.72:1 |
| Cyan `#22d3ee` | Navy `#0b1220` | 10.36:1 |
| Button ink `#071722` | Cyan `#22d3ee` | 10.06:1 |
| Control boundary `#7b8da3` | White `#ffffff` | 3.40:1 |
| Control boundary `#7b8da3` | Navy `#0b1220` | 5.51:1 |
| Error text `#a01435` | White `#ffffff` | 7.94:1 |

Cyan is reserved for dark surfaces and button backgrounds rather than body text on white. The process-step numbers previously failed contrast on light sections (1.80:1); they now use teal on light surfaces and cyan on dark surfaces. Pale decorative card borders remain subtle; essential form and ghost-button boundaries use the stronger control token. Visible teal/cyan keyboard outlines and reduced-motion behavior are retained. Placeholder text now explicitly uses the readable muted token.

## Updated files and affected routes

- `src/app/globals.css`: shared tokens, typography, cards, navigation, footer, forms, diagrams, responsive layouts, focus and hover states. This affects Home, Services, all six service detail pages, About, Work, OpsPilot, Contact, Insights and its three articles, Privacy, Terms, and shared error/not-found presentation.
- `src/components/layout.tsx`: mobile menu Escape dismissal with focus returned to its toggle.
- `src/app/insights/[slug]/page.tsx`: labeled, focusable code regions so horizontally scrolling examples work with a keyboard.
- `tests/e2e/site.spec.ts`: all requested viewport widths; unique desktop/mobile screenshots; Escape/focus coverage; all marketing/service/article routes checked for overflow and automated accessibility at phone and desktop widths.

## Logo status

Repository inspection found the temporary text/symbol header, footer wordmark, generated social wordmark, and `src/app/icon.svg`. No approved logo source or approval record was found. These existing assets remain untouched. Final navigation/footer integration, favicon/application icon updates, small-size review, and any logo-derived palette adjustment are pending the owner's original finalized logo file. No replacement symbol or trademark-clearance claim was created.

## Accessibility, SEO, and performance

Existing form behavior, validation, API handlers, business text, prices, SEO metadata, structured data, and font loading remain intact. No Cloudflare configuration, secrets, workflows, Turnstile settings, Brevo configuration, or database resources were changed.

Desktop homepage and 390px mobile homepage/contact screenshots were inspected. The mobile heading, stacked actions, form labels, inputs, and card flow remain legible. A homepage 200% root-text-size spot check at 390px and 1024px found no horizontal overflow. Automated checks cover 360, 390, 768, 1024, and 1440px; axe scans use WCAG 2 A/AA, 2.1 AA, and 2.2 AA tags at 360 and 1440px across 18 marketing routes, including every service and article detail page. These checks do not establish complete WCAG conformance or replace assistive-technology testing.

No new dependencies, image assets, runtime services, or font downloads were introduced. Production and Worker builds are checked locally. Field Core Web Vitals and a comparative Lighthouse performance measurement were not collected; no measured performance improvement is claimed. Tests use local pages and mocked form/security endpoints, not real submissions to external services.

## Verification results

- `npm run typecheck`: passed.
- `npm test`: all 50 tests passed across 3 files.
- `npm run build`: passed; all 28 static generation tasks completed.
- `npm run build:worker`: passed on the final rebuild, including the Worker manifest regression check.
- `npm run lint`: passed.
- Playwright: 14 existing desktop/mobile checks passed in the full run; the new route audit identified the code-region issue described above. After fixing it, all 6 targeted desktop/mobile checks passed (route audit, homepage, navigation), including zero axe violations across all 18 routes at 360/1440px and no page overflow at all five target widths. The route audit and affected navigation tests were rerun after the fixes; unrelated passing form tests were not repeated.
- Screenshots: desktop and mobile homepage captures plus a 390px contact view reviewed locally under ignored `test-results/`.
- `git diff --check`: passed.

PowerShell's script execution policy blocked `npm.ps1`; the same package scripts ran successfully through `npm.cmd` without changing system policy. OpenNext prints its existing Windows compatibility advisory. Vitest prints existing Vite module-format and experimental SQLite advisories. No checks were skipped because of these advisories.

## Remaining owner input

Supply the exact finalized logo source (preferably its verified SVG). The existing Privacy and Terms pages still describe themselves as drafts requiring business review; their content was preserved as requested.
