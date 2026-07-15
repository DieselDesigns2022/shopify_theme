# Diesel Designs Shopify Theme

## Project Purpose
This repository contains a completely original custom Shopify Online Store 2.0 theme created and owned by Diesel Designs. It is intended to be sold as a licensed theme for merchants who primarily sell physical products such as apparel, tumblers, drinkware, jewelry, handmade goods, home décor, candles, beauty products, personalized products, printed products, and craft supplies. Digital products, services, and mixed stores are planned compatibility targets.

## Current Development Status
Phase 1 includes only project bootstrap and the storefront foundation. The theme is not ready for production, live merchant use, or customer sale.

## Technology Stack
- Shopify Online Store 2.0 Liquid theme files.
- JSON templates and section groups.
- Vanilla CSS and JavaScript.
- GitHub as the source of truth.

## Theme Goals
The finished theme will support physical-product-first merchandising, flexible navigation, banners, product options, accessibility, SEO, performance, app blocks, and merchant documentation.

## Current Implementation
Implemented now: documentation, global settings, layout, header foundation, footer foundation, permanent attribution, welcome banner, image banner, divider banner, rich text homepage support, homepage template, 404 template, CSS foundation, JavaScript mobile menu foundation, locale files, and Theme Check configuration. Full product, collection, cart, search, blog, page, and account systems are not implemented yet.

## Planned Features
Planned future work includes product templates, collection filtering, cart drawer, cart page, predictive search, mega menus, product personalization, file uploads where Shopify supports them, swatches, app blocks, and complete merchant documentation.

## Quick Start
1. Work in this repository, which remains on `main` for this project.
2. Treat the Codex workspace name `work` as valid when Codex displays it.
3. Review the working tree before and after changes.
4. Run JSON validation, `git diff --check`, JavaScript syntax checks, and Theme Check where available.
5. Continue to the next phase only after changed-file review, documentation review, documentation consistency audit, and completion review.

## Repository Structure
- `assets/`: global CSS and JavaScript.
- `config/`: Theme Editor global settings and defaults.
- `docs/`: permanent project documentation.
- `layout/`: storefront HTML wrapper.
- `locales/`: customer-facing and schema translations.
- `sections/`: section groups and storefront sections.
- `snippets/`: reusable Liquid snippets.
- `templates/`: JSON templates.

## Development Workflow
GitHub is the source of truth for project files and history. This `shopify_theme` repository remains on `main` throughout development, while Codex may display the workspace name `work`. This project does not use separate phase branches, pull requests, or merge steps. After a phase passes changed-file review, documentation review, documentation consistency audit, and completion review, development continues directly into the next phase in the same repository.

## Final Theme Package
The complete theme will eventually be packaged as a Shopify-uploadable ZIP. Shopify CLI's `shopify theme package` command is the preferred packaging method when available. The ZIP must place recognized Shopify theme folders at the ZIP root, must not include an unnecessary outer `shopify_theme` folder, and must exclude repository-only files such as documentation, Git data, logs, backups, and development files. The ZIP will be uploaded to Shopify as a draft theme for testing before customer use. Shopify CLI and Theme Check are not currently installed in the Codex environment, so packaging and Shopify validation have not occurred yet. Exact packaging, download, and Shopify upload instructions are planned for the full-theme testing stage.

## Permanent Diesel Designs Attribution
Every completed theme installation must visibly display `Website by Diesel Designs` in the footer. `Diesel Designs` must link to `https://www.dieseldesigns.co`. The attribution is permanent and must not be removed, hidden, unlinked, disabled, or exposed as a merchant setting.

## Documentation Index
- `DEVELOPMENT.md`: developer guide.
- `CONTRIBUTING.md`: contribution rules.
- `docs/ARCHITECTURE.md`: theme architecture.
- `docs/DATABASE.md`: data boundaries.
- `docs/ROUTES.md`: Shopify route patterns.
- `docs/DEPLOYMENT.md`: deployment safety.
- `docs/TESTING.md`: test plan.
- `docs/SECURITY.md`: security responsibilities.
- `docs/SEO.md`: SEO foundation.
- `docs/TROUBLESHOOTING.md`: issue knowledge base.
- `docs/PHASE_HISTORY.md`: engineering history.
- `docs/CODEX_WORKFLOW.md`: AI workflow rules.

## Project Principles
Build original code only, keep merchant settings intentional, escape merchant-controlled output, keep JavaScript lightweight, document only implemented behavior, and clearly label future features as planned.

## License Status
This theme is created and owned by Diesel Designs and is intended for licensed sale. A final customer license is planned and has not been completed in Phase 1.
