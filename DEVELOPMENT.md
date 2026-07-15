# Development Guide

## Project Overview
Diesel Designs Shopify Theme is a custom Online Store 2.0 theme foundation for licensed future sale.

## Shopify Hosting Model
Shopify hosts the storefront and serves Liquid-rendered theme output. Development occurs in the GitHub-backed project repository and Codex workspace. This theme is not stored on or deployed to a VPS.

## Theme Architecture
The current architecture uses a single layout, JSON templates, section groups, sections, snippets, assets, config, and locales. There are no PHP controllers or local database.

## Request and Rendering Lifecycle
Shopify receives storefront requests, selects a template, renders sections through `layout/theme.liquid`, and injects Shopify platform content through `content_for_header` and `content_for_layout`.

## Layouts
`layout/theme.liquid` provides the HTML document, head metadata, skip link, header group, main landmark, and footer group.

## Templates
JSON templates control homepage and 404 layout in this phase. Product, collection, cart, search, page, and blog templates are planned.

## Section Groups
Section groups control the global header and footer, allowing Shopify to manage shared site regions.

## Sections
Phase 1 includes header, footer, welcome banner, image banner, divider banner, rich text, and main 404 sections.

## Blocks
Footer menu and text blocks are implemented. More blocks are planned for future merchandising sections.

## Snippets
Icon snippets provide reusable SVG icons for header actions and mobile navigation.

## Assets
`assets/base.css` contains the CSS foundation. `assets/theme.js` contains mobile menu and reveal behavior.

## Configuration
`config/settings_schema.json` defines global Theme Editor settings. `config/settings_data.json` stores safe default values.

## Locales
Locale files store customer-facing text and Theme Editor schema text.

## Theme Settings
Theme settings define global merchant customization such as colors, typography, layout, branding, and animation.

## Metafields
Future metafields will provide structured product, personalization, and content data. None are implemented in Phase 1.

## Metaobjects
Future metaobjects may support reusable structured content. None are implemented in Phase 1.

## Product Forms
Product forms are planned and not implemented in Phase 1.

## Cart Behavior
Cart pages, cart drawer, and AJAX cart behavior are planned and not implemented in Phase 1.

## Customer Accounts
Customer account implementation is Shopify-managed and planned for later theme integration.

## Accessibility
The foundation includes semantic landmarks, skip link, keyboard-safe buttons, ARIA menu state, focus return, alt handling, and reduced-motion CSS.

## Security
Plain merchant text is escaped. Rich text is used only where intentional. No secrets or external scripts are included.

## Development Workflow
This `shopify_theme` project remains on `main` throughout development, while Codex may display the workspace as `work`. GitHub remains the source of truth for files and history. The workflow uses changed-file review, documentation review, documentation consistency audit, and completion review instead of phase branches, pull requests, or merge steps.

## Testing Workflow
Run required automated checks and manually verify attribution, banner fallback behavior, and mobile menu behavior where a storefront preview is available.

## Deployment Workflow
Final testing will occur through a Shopify draft theme. When the full theme is ready, Shopify CLI's `shopify theme package` command is the preferred way to create a Shopify-uploadable ZIP. The ZIP must contain valid Shopify theme folders at the root and exclude repository-only files. Packaging and Shopify upload instructions are planned and have not been completed in Phase 1.

## Recovery Workflow
Use Git history for repository recovery and Shopify theme backups for draft or customer theme rollback. Do not commit backup files or include backups in the final Shopify upload ZIP.

## Documentation Maintenance
Every phase updates documentation before code and keeps future work labeled planned.

## Design Philosophy
The foundation is neutral, responsive, accessible, customizable, and appropriate for many merchant categories.

## Current Limitations
This is foundation only. Product, collection, cart, search, customer account, mega menu, predictive search, personalization, swatch, and live store testing work is not implemented.
