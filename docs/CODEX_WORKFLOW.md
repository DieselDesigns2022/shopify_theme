# Codex Workflow

## Source of Truth
GitHub remains the source of truth for the `shopify_theme` project files and history.

## Branch Verification
This project remains on `main` throughout development. Codex may display the workspace branch as `work`; `work` is valid Codex workspace terminology for this project and is not a workflow failure.

## Codex Workspace Branch Naming
`work` is the valid Codex workspace name used in this environment. Do not infer a separate GitHub source branch from that name for `shopify_theme`.

## Backup Rules
Do not create backup files, archives, generated ZIPs, logs, or temporary files in the repository. Final Shopify upload packages must also exclude repository-only files.

## Development Rules
Implement only the requested phase scope. Do not add secrets, copied theme code, temporary files, backup files, generated ZIP files, or unrequested features.

## Documentation Rules
Every phase updates documentation when behavior, workflow, packaging, validation, or limitations change. Documentation must match implementation and label future work as planned.

## Testing Rules
Run required checks, report exact results, and clearly identify unavailable tools. Shopify CLI and Theme Check are not currently installed in the Codex environment.

## Changed File Review
Codex should provide summaries and complete working-tree diffs for the files changed. Chat reviews the actual changed files.

## Documentation Audit
Confirm documentation is internally consistent, project-specific, and does not claim planned systems, packaging, Shopify validation, or live testing are complete.

## Completion Review
After changed-file review, documentation review, documentation consistency audit, and completion review, development continues directly into the next phase in the same repository.

## Pull Request Rules
This project does not use pull requests. Codex should not create pull request instructions or report pull request status for `shopify_theme` unless the project workflow changes.

## Merge Rules
This project does not use merge steps. Reporting should not include irrelevant merge confirmations.

## Shopify Deployment Rules
Shopify hosts and renders the storefront. This theme is not stored on or deployed to a VPS. Future release work will package the complete theme as a Shopify-uploadable ZIP and test it as a Shopify draft theme.

## Live Testing Rules
Live or draft-theme testing has not occurred in Phase 1. Future draft-theme testing must include Theme Editor, storefront, mobile, accessibility, and regression checks.

## Known Pitfalls
Do not introduce phase-branch, pull request, merge, push-to-branch, intended-source-branch, or VPS assumptions into this repository. This exception applies only to `shopify_theme`.

## Lessons Learned
Reporting should focus on changed files, checks, warnings, incomplete requirements, and complete diffs instead of irrelevant branch, pull request, merge, push, VPS, or future-phase confirmations.
