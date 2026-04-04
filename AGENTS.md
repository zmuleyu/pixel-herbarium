# AGENTS.md

## Project Overview
- `pixel-herbarium` is the active project.
- Project-specific instructions for pixel-herbarium.
- Stack: React, TypeScript.

## First Read
- Read `PROGRESS.md` before resuming ongoing work.
- Read `collab/reviews/handoff.md` and `collab/reviews/review.md` for active cross-agent workstreams.
- Inspect the relevant source files before editing.

## Commands
- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run test`
- `npm run typecheck`
- `npm run build:validate`
- `npm run build:dev:ios`
- `npm run build:preview:ios`
- `npm run build:prod:ios`
- `npm run build:prod:android`
- `npm run submit:ios`
- `npm run logs:ci`
- `npm run logs:ci:list`

## Testing And Validation
- Run the smallest relevant validation command after code changes.
- Do not claim completion without a concrete verification step.

## Collaboration Source Of Truth
- Read `collab/reviews/handoff.md` before resuming multi-session or multi-account work.
- Read `collab/reviews/review.md` before acting on a reviewed workstream.
- Prefer repo files over long chat summaries for handoff.
- Use `collab/ops/collab-writing-log.md` for writing-quality observations.
- Use `collab/ops/collab-issues.md` for collaboration process issues.

## Window Triggers
- Claude Code should use `.claude/commands/sync-collab.md` and `.claude/commands/check-collab.md` when present.
- Codex should use `docs/codex-task-index.md` plus `D:\tools\scripts\collab-sync-message.ps1` and `D:\tools\scripts\collab-check.ps1`.

## Boundaries
### Always do
- Keep changes scoped to this project.
- Mention the exact project directory in the final summary.
- Prefer file-based handoff in `collab/reviews/` over long chat summaries.

### Ask first
- Add new production dependencies.
- Change auth, secrets, deployment, or database/schema behavior.

### Never do
- Commit secrets, tokens, or machine-local state files.
- Revert unrelated user changes.
