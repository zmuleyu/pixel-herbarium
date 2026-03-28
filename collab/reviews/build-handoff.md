# iOS Build Handoff

## Status

- ready_for_rerun

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
