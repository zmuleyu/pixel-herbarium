# Context: Brand Visual System

**What we're building:** Replace placeholder Expo icons/splash with a branded visual identity system for 花図鉑 (Pixel Herbarium) — including App Icon, Splash Screen, dual-layer brand colors, and custom Tab Bar SVG icons.

**Locked decisions:**
- Icon concept: Elegant herbarium journal with botanical sakura + subtle pixel accents (hybrid of concepts B+C)
- Brand color: Dual-layer system — `#e8a5b0` stays for UI, `#D4537E` added as `brand.accent` for CTAs/icons
- Tab icons: Custom SVG replacing Ionicons (journal/stamp-circle/gear-with-leaf)
- Technical route: SVG native (zero external API dependency), Sharp for PNG export
- Scope: Layer 1-2 only; Layer 3 (popups/onboarding) and Layer 4 (v2 features) deferred to separate specs

**Non-goals / constraints:**
- NOT changing `app.json` native config (OTA safety)
- NOT modifying existing seasonal color values in `theme.ts`
- NOT implementing v2 product features (watermark editor, herbarium system) — separate spec
- NOT reordering `ALL_TABS` array (OTA hook safety)
- Icon/splash PNG replacement requires EAS Build (not OTA)

**Resolved edge cases:**
- 16px favicon → simplified to flower silhouette only (journal detail too small)
- Brand color conflict (`#e8a5b0` vs `#D4537E`) → resolved via dual-layer: existing is UI layer, new is brand layer
- Tab bar season theming → custom icons inherit `color` prop from season theme, no conflict
- Android adaptive icon → foreground contains journal+flower, background is cream gradient

## Transition Checklist
- [x] Scope: Single system (brand visual identity only)
- [x] Evidence: Icon placeholder confirmed by code read [EVIDENCE], color values from theme.ts [EVIDENCE]
- [x] Anti-pattern: Identified — "16px icon too complex" risk, mitigated by size-adaptive strategy
