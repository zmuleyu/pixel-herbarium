# AGENTS.md

## Project Overview
- `pixel-herbarium` is the active project.
- Project-specific instructions for pixel-herbarium.
- Stack: React, TypeScript.

## First Read
- Read `PROGRESS.md` before resuming ongoing work.
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

## Boundaries
### Always do
- Keep changes scoped to this project.
- Mention the exact project directory in the final summary.

### Ask first
- Add new production dependencies.
- Change auth, secrets, deployment, or database/schema behavior.

### Never do
- Commit secrets, tokens, or machine-local state files.
- Revert unrelated user changes.
