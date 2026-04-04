# Collaboration Issues

## AHB-20260402-window-trigger
- id: AHB-20260402-window-trigger
- date: 2026-04-02
- category: window_trigger
- symptom: the repository previously lacked direct Claude/Codex window triggers
- impact: sync depended on manual trigger text
- workaround: repo-local `.claude/commands` and `docs/codex-task-index.md` were added
- proposed_fix: keep the new window trigger files in sync with `collab/reviews/`
- status: resolved

## AHB-20260402-dirty-worktree
- id: AHB-20260402-dirty-worktree
- date: 2026-04-02
- category: cross-agent_misalignment
- symptom: the working tree contains many unrelated modified and untracked files from prior business work, generated artifacts, and the new collab-toolkit changes at the same time
- impact: an agent can easily over-assume task scope, stage unrelated files, or give an inaccurate completion summary
- workaround: treat current code changes and collab-toolkit files as separate staging scopes, and re-check `git status --short` before any commit or PR
- proposed_fix: add a pre-commit scoping pass or a repo note that marks generated artifact folders and unrelated work-in-progress paths
- status: open
