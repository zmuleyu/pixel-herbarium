# Pixel Herbarium (花図鑑)

Japanese plant discovery and pixel art collection app.

## Tech Stack

- **Framework:** Expo 55 (React Native 0.83)
- **Routing:** Expo Router (file-based, `src/app/`)
- **Backend:** Supabase (PostgreSQL + Edge Functions + Auth + Storage)
- **State:** Zustand
- **i18n:** i18next (Japanese primary, English secondary)
- **Maps:** react-native-maps + expo-location

## Project Structure

```
src/
├── app/              Expo Router pages
│   ├── (auth)/       Login flow
│   ├── (tabs)/       Main tabs: discover, herbarium, map, profile
│   └── plant/[id]    Plant detail page
├── constants/        Theme colors, plant counts, quotas
├── hooks/            Custom React hooks
├── i18n/             Translation files
├── services/         Supabase client, auth, anti-cheat
├── stores/           Zustand stores
├── types/            Supabase-generated DB types
└── utils/            Date, geo, validation helpers

supabase/
├── functions/        Edge Functions: identify, pixelate, verify
├── migrations/       9 SQL migrations (plants → quotas → RLS)
└── seed/             60 plant seed data (spring set)
```

## Key Constants

- `TOTAL_PLANTS = 60` (30★ common + 20★★ uncommon + 10★★★ limited)
- `MONTHLY_QUOTA = 5` (free tier identification limit)
- `COOLDOWN_RADIUS_METERS = 50` / `COOLDOWN_DAYS = 7`
- `MAP_RADIUS_METERS = 5000` / `FUZZ_RADIUS_METERS = 100`

## Design System

- **Style:** Adult Kawaii (cream + sage green, NOT childish)
- **Colors:** See `src/constants/theme.ts`
- **Font:** HiraginoMaruGothicProN (labels) + System (body)
- **Tone:** Warm, poetic, never anxious. See `docs/design-system.md`

## Documentation

| Document | Purpose |
|----------|---------|
| `docs/product-spec.md` | Core loop design: collection, seasonal FOMO, viral sharing |
| `docs/competitive-insights.md` | Key competitor takeaways informing design decisions |
| `docs/design-system.md` | Visual design system: colors, typography, tone of voice |

Research materials are in `docs/research/` (competitor, market, platform, data, design, launch). See `docs/INDEX.md` for full navigation.

## Development Notes

- Theme colors defined in `src/constants/theme.ts` — always reference, never hardcode hex values
- Plant rarity uses integer 1-3 (not string labels) in DB and code
- `available_window DATERANGE` in plants table controls ★★★ seasonal availability — NULL means always available
- All text facing users should go through i18next, not hardcoded strings
- Comments in English, variable names in camelCase
