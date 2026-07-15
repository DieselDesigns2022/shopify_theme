# Deployment

## Source of Truth
GitHub remains the source of truth for project files and history.

## Development Repository Role
Development occurs in this repository and Codex workspace. This repository remains on `main`; Codex may display the workspace as `work`. The repository is not a storefront host.

## Shopify Hosting Model
Shopify hosts and renders the storefront. The theme will be uploaded to Shopify for draft-theme testing before customer use.

## Validation Before Packaging
Before packaging, run JSON validation, JavaScript syntax checks, `git diff --check`, and Shopify Theme Check when available. Shopify CLI and Theme Check are not currently installed in the Codex environment, so Shopify validation has not been completed.

## Shopify CLI Packaging
When the full theme is ready for testing, Shopify CLI's `shopify theme package` command is the preferred packaging method when available. Do not claim a packaging script currently exists.

## ZIP Root Structure
The package must contain recognized Shopify theme folders at the ZIP root, such as `assets`, `config`, `layout`, `locales`, `sections`, `snippets`, and `templates`. The ZIP must not contain an unnecessary outer `shopify_theme` folder.

## Files Excluded From Shopify Upload
Repository-only files must not be included in the Shopify upload package. Exclude documentation, Git data, logs, backups, temporary files, development files, credentials, tokens, `.env` files, and generated archives.

## Draft Theme Upload
The completed ZIP will be uploaded to Shopify as a draft theme for testing before customer use. Exact packaging, download, and Shopify upload instructions will be completed when the full theme is ready for testing.

## Draft Theme Testing
Draft-theme testing must include Theme Editor checks, storefront rendering, mobile behavior, accessibility checks, attribution verification, and regression testing.

## Production and Customer Theme Safety
Do not replace or overwrite a customer theme without review. Back up the customer theme before replacement and verify the uploaded draft theme before any customer-facing use.

## Shopify Theme Backup and Rollback
Use Shopify theme backups and Git history for rollback. Backups and ZIP packages must not be committed to the repository.

## Final Downloadable Theme Delivery
The final customer deliverable is planned to be a Shopify-uploadable ZIP theme file. Packaging and delivery have not occurred in Phase 1.

## Customer Theme Safety
Customer-facing use requires successful draft-theme testing, attribution verification, and final review.
