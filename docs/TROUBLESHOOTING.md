# Troubleshooting

## Unexpected Codex workspace name
- Symptom: Codex shows the workspace branch as `work`.
- Likely cause: `work` is Codex workspace terminology for this project.
- Diagnosis: Run `git branch --show-current` and confirm project instructions.
- Solution: Treat `work` as valid for Codex while the real `shopify_theme` project remains on `main`.
- Prevention: Do not introduce separate branch assumptions for this repository.
- Lesson learned: The `main`/`work` setup is project-specific to `shopify_theme`.

## Dirty working tree
- Symptom: `git status --short` shows files before work starts.
- Likely cause: Uncommitted edits.
- Diagnosis: Review status and diffs.
- Solution: Stop and ask for direction.
- Prevention: Start from a clean tree.
- Lesson learned: Clean state protects phase scope.

## Shopify CLI unavailable
- Symptom: `shopify theme check` fails as missing command.
- Likely cause: Shopify CLI is not installed.
- Diagnosis: Run `shopify theme check`.
- Solution: Use `theme-check` fallback if available.
- Prevention: Install Shopify CLI in development environments.
- Lesson learned: Report unavailable tools clearly.

## Theme Check unavailable
- Symptom: Neither Shopify CLI nor `theme-check` runs.
- Likely cause: Theme Check is not installed.
- Diagnosis: Try both commands.
- Solution: Document limitation and setup instructions.
- Prevention: Include Theme Check in environment setup.
- Lesson learned: Do not mark unavailable checks as passed.

## Invalid JSON template
- Symptom: Shopify rejects a template.
- Likely cause: Invalid JSON syntax or section references.
- Diagnosis: Run Python JSON validation.
- Solution: Fix syntax and section IDs.
- Prevention: Validate all JSON files.
- Lesson learned: JSON validation is mandatory.

## Invalid section schema
- Symptom: Theme Editor rejects a section.
- Likely cause: Bad schema JSON inside Liquid.
- Diagnosis: Run Theme Check where available.
- Solution: Fix schema structure and setting IDs.
- Prevention: Keep schemas simple and valid.
- Lesson learned: Liquid files need schema review.


## Missing Diesel Designs attribution
- Symptom: Footer lacks required attribution.
- Likely cause: Footer markup was changed.
- Diagnosis: Search for `Website by Diesel Designs`.
- Solution: Restore hardcoded footer attribution.
- Prevention: Keep attribution outside optional blocks.
- Lesson learned: Attribution is permanent.

## Broken Diesel Designs link
- Symptom: Attribution text exists but URL is wrong.
- Likely cause: Manual edit typo.
- Diagnosis: Search for `https://www.dieseldesigns.co`.
- Solution: Restore exact URL.
- Prevention: Validate attribution URL.
- Lesson learned: Exact link matters.

## Missing mobile banner fallback
- Symptom: Mobile banner has no image when no mobile image is uploaded.
- Likely cause: No fallback to desktop image.
- Diagnosis: Inspect banner Liquid.
- Solution: Assign mobile image to desktop image when blank.
- Prevention: Test empty mobile image settings.
- Lesson learned: Mobile image must fall back.

## Mobile menu does not close
- Symptom: Drawer remains open.
- Likely cause: Missing close, Escape, or overlay handlers.
- Diagnosis: Test button, overlay, and Escape key.
- Solution: Reinitialize mobile navigation JavaScript.
- Prevention: Keep defensive event binding.
- Lesson learned: Multiple close paths are required.

## JavaScript loaded before required markup
- Symptom: JavaScript errors on missing elements.
- Likely cause: Early execution or missing guards.
- Diagnosis: Check console and script loading.
- Solution: Use defer and DOM-ready-safe initialization with element checks.
- Prevention: Keep defensive JavaScript.
- Lesson learned: Header may be absent during section reloads.

## Invalid logo image dimensions
- Symptom: Theme validation reports invalid image height attributes.
- Likely cause: Logo markup used nonnumeric `height` values.
- Diagnosis: Search Liquid files for `height="auto"`.
- Solution: Calculate numeric height from the selected image aspect ratio or use valid Shopify image output.
- Prevention: Validate image markup after logo changes.
- Lesson learned: Responsive CSS should control display size, but HTML dimensions must remain valid.

## Banner full-link label is translated incorrectly
- Symptom: A merchant heading appears to be treated as a locale key.
- Likely cause: Merchant text was passed through the translation filter.
- Diagnosis: Inspect banner aria-label Liquid logic.
- Solution: Escape merchant headings directly and use translations only for fallback labels.
- Prevention: Never pass merchant-entered plain text through `t`.
- Lesson learned: Accessibility labels must preserve merchant content safely.

## Mobile drawer focus escapes
- Symptom: Tab or Shift+Tab leaves the open mobile drawer.
- Likely cause: Drawer lacks focus trapping.
- Diagnosis: Open the mobile menu and keyboard through controls.
- Solution: Trap focus inside the drawer and close on Escape, overlay, or close button.
- Prevention: Test mobile navigation with keyboard after JavaScript changes.
- Lesson learned: Opening focus is not enough; focus must remain contained until close.

## Reveal content remains hidden
- Symptom: Sections remain invisible after Theme Editor reload or in unsupported browsers.
- Likely cause: Reveal classes were initialized without a working observer or were duplicated incorrectly.
- Diagnosis: Check `data-reveal-ready`, reduced-motion settings, and IntersectionObserver support.
- Solution: Initialize only new elements, skip animation for reduced motion, and leave content visible when IntersectionObserver is unavailable.
- Prevention: Test page load and Shopify section reload behavior.
- Lesson learned: Enhancement scripts must fail visible.


## Shopify ZIP upload fails
- Symptom: Shopify rejects the uploaded theme ZIP or does not recognize it as a valid theme.
- Likely cause: Theme directories are inside an extra outer folder, required Shopify theme directories are missing, repository-only files were packaged, or the ZIP was made from the whole repository instead of the Shopify theme structure.
- Diagnosis: Inspect the ZIP root and confirm recognized Shopify folders such as `assets`, `config`, `layout`, `locales`, `sections`, `snippets`, and `templates` are at the root.
- Solution: Rebuild the package with the Shopify theme folders at the ZIP root and exclude documentation, Git data, backups, logs, temporary files, credentials, and development-only files. Prefer `shopify theme package` when Shopify CLI is available.
- Prevention: Verify ZIP structure before upload and do not package the entire repository.
- Lesson learned: The Shopify upload package is not the same thing as the development repository.

## Global design setting has no storefront effect
- Symptom: A Theme Editor global design setting saves but the storefront appearance does not change.
- Likely cause: The setting is missing from `layout/theme.liquid` CSS variables or from the reusable CSS utilities in `assets/base.css`.
- Diagnosis: Compare the setting ID in `config/settings_schema.json` to the variables emitted in `layout/theme.liquid` and the selectors that consume those variables.
- Solution: Add or correct the CSS variable and connect it to a reusable utility or global component style.
- Prevention: For every new Phase 4 setting, validate that it has a storefront effect before committing.
- Lesson learned: Global settings are only useful when future sections can safely consume them.


## Header utility visibility mismatch
- Symptom: Search, account, cart, email, or phone utility links appear when a global or section-level setting should hide them.
- Likely cause: Header Liquid is not combining the global Theme Editor setting with the header-section setting, or contact fallback values are not stripped before rendering.
- Diagnosis: Check `sections/header.liquid` for `render_search_action`, `render_account_action`, `render_cart_action`, `effective_phone_number`, and `effective_email_address`.
- Solution: Gate actions in Liquid and render only one effective contact link for each utility value.
- Prevention: Validate desktop and mobile header actions after changing global utility settings.
- Lesson learned: CSS hiding is not enough for global utility controls.
