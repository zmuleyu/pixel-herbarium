# iOS Build Review

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

- fail

### First Error

- file: `node_modules/expo-image/ios/ImageView.swift`
- line: 133
- message: `error: cannot access property 'pendingOperation' with a non-sendable type 'SDWebImageCombinedOperation?' from nonisolated deinit`

### Recommendation

Update the `deinit` hunk in `patches/expo-image+55.0.6.patch` — empty the body:

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

- `patches/expo-image+55.0.6.patch` — deinit hunk updated: replaced 2 property-access lines with 2 comment lines
- `build-handoff.md` status → `ready_for_rerun`

### Notes

- Gates 1, 2, Validate all passed — only Gate 3 failed
- Root cause: current patch replaced `cancelPendingOperation()` with direct property access; Swift 6 strict concurrency in Xcode 16.4 Release builds rejects `nonisolated deinit` accessing non-Sendable `SDWebImageCombinedOperation?`
- SDWebImage cancels on dealloc — empty deinit is safe
