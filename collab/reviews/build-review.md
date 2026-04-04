# iOS Build Review

## Sync Protocol

- source_of_truth: `collab/reviews/build-review.md`
- companion_handoff: `collab/reviews/build-handoff.md`
- chat_contract: review current files and git diff; do not paste full chat history
- issue_limit: blockers first, then residual risks

## Reviewer

- `Claude Code`

## Scope

- Review current preview run and diagnostics only
- Record the first real `Gate 3` error
- Confirm whether the fix targets the first failing error only

## Mode

- low-token

## First Real Error Only

- required

## Current Run

- `23679517162`
- `headSha=7e8915e7ee8be2879cdf7d73a0dfdaed22a30802`

## Recording Format

### Conclusion

- pass (rerun `23679841200` / SHA `f3a9759`)

### First Error

- file: `node_modules/expo-image/ios/ImageView.swift`
- line: 133
- message: `error: cannot access property 'pendingOperation' with a non-sendable type 'SDWebImageCombinedOperation?' from nonisolated deinit`

### Recommendation

Update the `deinit` hunk in `patches/expo-image+55.0.6.patch` to empty the body:

```diff
   deinit {
-    pendingOperation?.cancel()
-    pendingOperation = nil
+    // Swift 6: nonisolated deinit cannot access non-Sendable @MainActor properties.
+    // SDWebImage cancels in-flight operations on deallocation.
   }
```

After updating the patch file, re-trigger preview on the same SHA (`7e8915e`).

### Fix Applied

- `patches/expo-image+55.0.6.patch` deinit hunk updated: replaced 2 property-access lines with 2 comment lines
- `build-handoff.md` status -> `ready_for_rerun`

### Release Run

- release run `23680543119` on SHA `f3a9759` -> **PASS** (10m28s, ASC submit complete)
- triggered after preview pass confirmation

### Notes

- Gates 1, 2, Validate all passed; only Gate 3 failed
- Root cause: current patch replaced `cancelPendingOperation()` with direct property access; Swift 6 strict concurrency in Xcode 16.4 Release builds rejects `nonisolated deinit` accessing non-Sendable `SDWebImageCombinedOperation?`
- SDWebImage cancels on dealloc; empty deinit is safe

---

## App Stability Optimization

### Freshness

- reviewer: `Codex pre-close summary for Claude sync`
- reviewed_at: `2026-04-02 Asia/Shanghai`
- repo: `D:\projects\Games\pixel-herbarium`
- branch: `dev`
- head_sha: `workspace-uncommitted`

### Health

- review_status: `approved_with_notes`
- blocking_issue_count: `0`
- first_blocker:
  - file: `none`
  - line: `none`
  - message: `none`

### Signals

- scope_seen:
  - Supabase mutation error handling
  - guest/loading deadlock fixes
  - settings storage whitelist reset
  - stamp/share failure surfacing
  - targeted regression tests
- verification_seen:
  - `npm run typecheck`
  - `npm test -- --runTestsByPath __tests__/services/analytics.test.ts __tests__/hooks/useNearbyDiscoveries.test.ts __tests__/hooks/usePlantDetail.test.ts __tests__/components/stamps/GestureStampOverlay.test.tsx __tests__/components/stamps/StampPreview.test.tsx __tests__/components/ShareSheet.test.tsx`
- residual_risks:
  - React 19 `react-test-renderer` act warnings remain as test-environment noise
  - optional follow-up coverage for `checkin-wizard` and `usePushToken` failure branches

### Queue

- recommended_next_action:
  - Claude Code should sync from files and current diff, then confirm there is no missed blocker
- review_notes:
  - no strategy restart
  - no full-history recap
  - prefer current diff over chat summary if they disagree
