# Phase History

## Phase 0 — Project Bootstrap

### Planning
The repository was initialized for future Shopify theme work.

### Objective
Create a clean source-control starting point.

### Documentation Created
Initial repository history was established; the full documentation system is created in Phase 1.

### Standards Established
Git is the source of truth.

### Architecture Decisions
Shopify Online Store 2.0 is the target architecture.

### Security Decisions
No secrets belong in the repository.

### Testing
Initial commit verification only.

### Known Limitations
No theme foundation files existed yet.

### Lessons Learned
Start every phase by verifying branch, status, and latest commit.

### Status
Complete.

## Phase 1 — Theme Foundation

### Planning
Phase 1 builds documentation first, then the minimal Shopify theme foundation.

### Objective
Create the documentation system, development standards, architecture, settings, layout, header, footer, attribution, banners, homepage, 404, CSS, JavaScript, locales, and validation setup.

### Documentation Created
README, changelog, contributing guide, development guide, architecture, data, routes, deployment, testing, security, SEO, troubleshooting, phase history, and Codex workflow documentation.

### Standards Established
The `shopify_theme` repository remains on `main`, Codex may display the workspace as `work`, GitHub remains the source of truth, every file is reviewed, original code is required, and future features remain planned until implemented.

### Architecture Decisions
Use Shopify section groups for header/footer, JSON templates for homepage/404, reusable icon snippets, and separate banner sections. Shopify hosts and renders the storefront; no VPS storage or deployment model is used for this theme.

### Security Decisions
Escape merchant-controlled plain text, avoid secrets, avoid external scripts, and keep attribution permanent.

### Testing
Automated validation is required for Git whitespace, JSON, JavaScript syntax, Theme Check where available, attribution, and banner fallback.

### Known Limitations
No live Shopify preview testing, draft-theme upload, or final ZIP packaging occurred in Phase 1. Product, collection, cart, search, account, mega menu, predictive search, swatches, and personalization are planned.

### Lessons Learned
Documentation must precede code and must not claim future features are complete. This project does not use a VPS, separate branch workflow, pull request workflow, or merge workflow; the final deliverable is planned as a Shopify-uploadable ZIP.

### Status
Implemented for Phase 1 foundation.


## Phase 2 — Announcement System

### Planning
Phase 2 adds a Shopify section-group announcement bar above the header.

### Objective
Implement multiple merchant-controlled announcements with static, rotating, and scrolling display modes.

### Architecture Decisions
The announcement bar lives in the existing header section group before the header, uses original inline SVG icons, vanilla CSS, and private theme JavaScript controllers without external libraries.

### Accessibility Decisions
Moving announcements include pause/resume controls, hover and keyboard-focus pausing, no duplicated focusable marquee content, translated labels, and reduced-motion behavior that stops automatic movement while keeping content usable.

### Testing
Required checks include JSON validation, JavaScript syntax validation, whitespace validation, Theme Check when available, and manual Shopify preview testing for section loading/unloading, dismissal, visibility, and reduced motion. Shopify preview testing has not yet occurred.

### Known Limitations
Live Shopify Theme Editor and storefront preview testing are still required before production readiness.

### Status
Implemented for changed-file review.

## Phase 3 — Global Styling and Header Navigation

### Objective
Implement the global design-system settings and the header/navigation foundation.

### Architecture Decisions
Global branding, typography, layout, component, animation, social, and preset settings are centralized in Shopify theme settings. The header supports left-inline, centered-below, centered-split, compact, sticky, transparent, dropdown, mega-menu, utility-link, social-link, mobile-drawer, and app-block areas using Liquid snippets, CSS custom properties, and vanilla JavaScript controllers.

### Accessibility Decisions
Dropdowns and mobile submenus use buttons with `aria-expanded` and `aria-controls`, Escape/outside-click handling, focus return, mobile focus trapping, visible focus styles, and reduced-motion handling.

### Testing
Automated validation was run in the Codex environment. Live Shopify Theme Editor and storefront preview testing is still required.

### Known Limitations
Product, collection, cart system, homepage merchandising, predictive search, and live Shopify preview validation remain future work.

### Status
Implemented for changed-file review.
