# Contributing

## Branch Rules
This `shopify_theme` repository remains on `main` throughout development. Codex may display the workspace branch as `work`, which is valid for this project. This project-specific exception does not use separate phase branches.

## Source of Truth
GitHub is the source of truth for repository state, review history, and approved changes.

## Coding Standards
Write original code only. Do not copy Dawn, Shine a Light Designs, Terrific Trend, or commercial theme code. Every changed file must be reviewed.

## Liquid Standards
Use semantic HTML, Shopify route helpers, reusable snippets, and escape merchant-controlled plain text output. Use rich text only where intentionally supported.

## JSON and Schema Standards
Keep JSON valid, use clear IDs and labels, and ensure documentation matches implementation.

## CSS Standards
Use mobile-first CSS, theme variables, visible focus states, and no CSS framework. Do not hide attribution.

## JavaScript Standards
Keep JavaScript lightweight, vanilla, defensive, dependency-free, and scoped. No product or cart code should be added before its phase.

## Accessibility Standards
Test mobile and desktop, keyboard navigation, visible focus states, landmarks, ARIA states, and reduced-motion behavior.

## Security Standards
No secrets, tokens, credentials, private store data, `.env`, unsafe injection, external scripts, or copied theme code.

## Documentation Standards
Documentation must be created or updated with every phase and must describe only what is implemented. Planned systems must be labeled planned.

## Testing Requirements
Run `git diff --check`, JSON validation, JavaScript syntax checks where Node is available, and Theme Check where available.

## Backup Requirements
No backup files belong in Git. Do not commit `.bak`, `.backup`, archives, logs, or temporary files.

## Pull Request Workflow
This project does not use pull requests. Chat reviews the actual changed files and working-tree diffs directly in the repository workflow.

## Review Requirements
No merge step is used for this project. Required reviews are changed-file review, documentation review, documentation consistency audit, and completion review.

## Phase Completion Checklist
Confirm the repository is in the expected `main`/Codex `work` state, review changed files, verify no backups, no secrets, no copied code, matching documentation, passing checks, and permanent attribution. After approval, continue directly into the next phase in the same repository.

## Lessons Learned
Treat Codex `work` as valid workspace terminology for this project. Do not introduce branch, pull request, merge, or VPS assumptions into this repository workflow.
