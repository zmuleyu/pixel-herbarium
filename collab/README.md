# Collaboration Workflow

## Rule

- Use repository files for agent handoff and review.
- Do not rely on long chat summaries as the source of truth.
- Build and CI debugging uses strong governance by default once the retry threshold is crossed.

## Files

- `collab/reviews/build-handoff.md`
  - current owner
  - latest commit
  - latest run id
  - current conclusion
  - next step
  - do not list
- `collab/reviews/build-review.md`
  - reviewer result
  - first real error
  - one direct recommendation
- `collab/reviews/handoff.md`
  - current cross-agent workstream state
  - validation already seen
  - current blockers or lack of blockers
  - direct next action
- `collab/reviews/review.md`
  - current review outcome for non-build workstreams
- `collab/ops/collab-writing-log.md`
  - handoff and review writing quality notes
- `collab/ops/collab-issues.md`
  - collaboration mechanism issues, not product bugs

## Standard Flow

1. Active executor updates `build-handoff.md`.
2. Next executor reads `build-handoff.md` before acting.
3. Reviewer writes findings to `build-review.md`.
4. Executor fixes the first real issue only.
5. Executor updates `build-handoff.md` again before the next transfer.

## Escalation Threshold

Switch to low-token mode when any one is true:

- the same pipeline fails `>= 3` times in a row
- the same subsystem fails `>= 2` times with the same class of error
- the same problem produces `>= 5` fix commits without a pass
- a second agent needs to take over

When low-token mode is active:

- no long chat summaries
- diagnostics must be downloaded before a fix is chosen
- only the first real error may be handled in each round
- release work is blocked until preview passes on the same sha
- output is limited to:
  - conclusion
  - current run id / sha
  - first real error
  - direct next step

## Upgrade Order

If five fixes still do not produce a pass, upgrade in this order:

1. diagnostics mechanism
2. patch mechanism
3. dependency source or build path
4. strategy change

## Trigger Message

Use this message when handing work to another agent:

```text
Please continue from:
D:\projects\Games\pixel-herbarium\collab\reviews\build-handoff.md

Write review output to:
D:\projects\Games\pixel-herbarium\collab\reviews\build-review.md
```

When the user asks to sync or notify Claude Code, include this trigger message proactively instead of waiting for a follow-up request.

For generic cross-agent sync:

```text
Please sync with the latest work in the current workspace.

Read:
- collab/reviews/handoff.md
- collab/reviews/review.md
- PROGRESS.md
- current uncommitted git diff
```

## Constraints

- Do not change build strategy unless the handoff explicitly says strategy is open.
- Do not run release before preview passes on the same sha.
- Do not replace file-based handoff with chat-only summaries.
