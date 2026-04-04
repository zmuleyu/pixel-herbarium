# iOS Build Handoff

## Sync Protocol

- source_of_truth: `collab/reviews/build-handoff.md`
- companion_review: `collab/reviews/build-review.md`
- chat_contract: point agents to these files plus current git diff; do not paste long chat recaps
- section_limit: keep each active workstream compact and evidence-based

## Status

- testflight_distributed

## Mode

- low-token

## Failure Class

- archive/compile

## Attempt Count

- 3+

## Repo

- `D:\projects\Games\pixel-herbarium`

## Branch

- `dev`

## Latest Commit

- `7e8915e` `ci: disable expo image live text analysis for xcode 16`

## Latest Preview Run

- `23679517162`
- `headSha=7e8915e7ee8be2879cdf7d73a0dfdaed22a30802`

## Current Conclusion

- iOS build has been migrated to `GHA macOS + expo prebuild + xcodebuild archive/export`
- `ref gate`, `prepare gate`, and diagnostics are already in place
- Expo native compatibility has been migrated from shell regex patches to `patch-package`
- `Gate 2` now passes stably
- Current work is only `Gate 3` archive follow-up
- Strong governance is active because the preview chain has exceeded the retry threshold

## Key Files

- `.github/workflows/preview-build.yml`
- `.github/workflows/release.yml`
- `scripts/ios-build-setup.sh`
- `scripts/ios-build-archive.sh`
- `scripts/ios-patch-verify.sh`
- `patches/expo-image+55.0.6.patch`
- `patches/expo-image-picker+55.0.12.patch`
- `patches/expo-notifications+55.0.12.patch`
- `patches/expo-router+55.0.5.patch`
- `patches/expo-modules-core+55.0.17.patch`

## What Was Fixed

- Removed repeated `Gate 2` failures caused by brittle shell patch matching
- Replaced Expo compatibility patching with `patch-package`
- Fixed `expo-image` archive failure by disabling live text analysis on Xcode 16 archive path

## Next Step

1. Watch preview run `23679517162`
2. If it fails, download diagnostics artifact
3. Fix only the first real `Gate 3` error
4. Re-run preview
5. Do not touch `release.yml` until preview passes

## Output Contract

- conclusion
- current run id / sha
- first real error
- direct next step

## Do Not

- Do not change build strategy
- Do not revert to `eas build --local`
- Do not reintroduce shell regex patching for Expo modules
- Do not run release before preview passes on the same sha

---

## App Stability Optimization

### Freshness

- status: completed
- updated_at: `2026-04-02 Asia/Shanghai`
- owner: `Codex`
- repo: `D:\projects\Games\pixel-herbarium`
- branch: `dev`
- head_sha: `workspace-uncommitted`

### Health

- priority: `P1`
- blocker_count: `0`
- failure_class:
  - mutation error handling
  - guest/loading deadlock
  - settings storage boundary
  - share/stamp silent failure
- scope:
  - stabilize app flows without schema/auth/deploy/dependency changes

### Signals

- current_conclusion: app stability pass is complete; no further blocking fixes are currently required
- key_files:
  - `src/hooks/usePlantDetail.ts`
  - `src/hooks/useNearbyDiscoveries.ts`
  - `src/app/(tabs)/settings.tsx`
  - `src/components/ShareSheet.tsx`
  - `src/utils/app-storage.ts`
- validation:
  - `npm run typecheck`
  - `npm test -- --runTestsByPath __tests__/services/analytics.test.ts __tests__/hooks/useNearbyDiscoveries.test.ts __tests__/hooks/usePlantDetail.test.ts __tests__/components/stamps/GestureStampOverlay.test.tsx __tests__/components/stamps/StampPreview.test.tsx __tests__/components/ShareSheet.test.tsx`
- blockers:
  - none

### Queue

- next_action:
  1. Claude Code reads handoff/review files plus current git diff
  2. Claude confirms no missed blocker
  3. Keep implementation closed unless a concrete blocker is found
- do_not_touch:
  - do not reopen schema/auth/deploy/dependency changes
  - do not expand into unrelated refactors
- claude_trigger:
  ```text
  Please sync with the latest work in the current workspace.
  Read:
  - collab/reviews/build-handoff.md
  - collab/reviews/build-review.md
  - PROGRESS.md
  - current uncommitted git diff
  Task:
  - confirm current status
  - confirm whether any blocking issue remains
  - do not reopen implementation unless you find a concrete blocker
  ```
