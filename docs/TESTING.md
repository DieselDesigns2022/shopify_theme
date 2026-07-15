# Testing

## Testing Status Labels
Use: Implemented, Partially implemented, Planned, Not applicable.

## Required Automated Checks
Implemented: `git diff --check`, JSON validation, JavaScript syntax check where Node is available, and Theme Check where available.

## JSON Validation
Implemented for all `*.json` files with Python.

## Liquid Validation
Partially implemented through Theme Check where available.

## Theme Check
Implemented when Shopify CLI or `theme-check` is available.

## Homepage Testing
Implemented: verify `index.json` loads configured sections.

## Header Testing
Partially implemented: verify logo fallback, menu links, mobile drawer, and actions.

## Footer Testing
Partially implemented: verify optional content and footer blocks.

## Attribution Testing
Implemented: verify visible text, exact URL, and no removal setting.

## Welcome Banner Testing
Partially implemented: verify desktop/mobile settings, fallback, optional text, optional button, and optional full link.

## Image Banner Testing
Partially implemented: verify reusable banner behavior.

## Divider Banner Testing
Partially implemented: verify image-only divider, decorative alt, and mobile fallback.

## 404 Testing
Implemented: verify editable 404 section and return-home link.

## Product Testing
Planned.

## Variant Testing
Planned.

## Product Form Testing
Planned.

## Collection Testing
Planned.

## Search Testing
Planned.

## Cart Testing
Planned.

## Physical Product Testing
Planned.

## Digital Product Testing
Planned.

## Service Product Testing
Planned.

## Mobile Testing
Partially implemented through responsive CSS and mobile menu checks.

## Desktop Testing
Partially implemented through layout and navigation checks.

## Accessibility Testing
Partially implemented through focus, landmarks, ARIA, alt handling, and reduced motion checks.

## SEO Testing
Partially implemented through title, description, canonical, and heading checks.

## Performance Testing
Partially implemented by avoiding frameworks and external dependencies.

## Empty State Testing
Implemented for homepage banners without uploaded images.

## Regression Testing
Planned for future phases.

## Smoke Testing
Planned for live Shopify preview or unpublished theme deployments.

## Phase 1 Correction Testing
Required manual Phase 1 correction checks for a Shopify preview: verify selected Shopify body and heading fonts load through Shopify font handling; logo image markup uses valid numeric dimensions; no empty mobile drawer appears when no menu is selected; Tab and Shift+Tab remain inside the open mobile drawer; focus returns to the menu trigger after close; full-banner links work when a button label exists without a button link; merchant banner headings are not treated as translation keys; desktop banner headings and text remain readable over images; newly loaded Theme Editor sections initialize reveal behavior; and reduced-motion or no-IntersectionObserver fallbacks keep content visible. These checks are required before production readiness and have not been completed through live Shopify preview testing in Phase 1.


## Theme Package Testing
Planned/required before customer use: run Shopify Theme Check before packaging when available; verify the ZIP contains only valid Shopify theme folders; confirm theme folders are at the ZIP root; confirm there is no outer project folder; exclude documentation, Git data, backups, logs, temporary files, credentials, and development-only files; upload successfully as a Shopify draft theme; then complete Theme Editor, storefront, mobile, accessibility, attribution, performance, and regression testing after upload. These checks have not been completed in Phase 1.
