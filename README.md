# Pixel Herbarium (花図鑑)

Japanese plant discovery and pixel art collection mobile app. Discover real plants, collect pixel art cards, and build your personal herbarium.

## Quick Start

```bash
npm install
npx expo start          # Start development server
npx expo start --ios    # iOS simulator
npx expo start --android # Android emulator
```

## Tech Stack

- **Framework**: Expo 55 (React Native 0.83)
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + Storage)
- **State**: Zustand
- **i18n**: i18next (Japanese primary, English secondary)
- **Maps**: react-native-maps + expo-location
- **Testing**: Jest (66 suites / 563 tests)

## Features

- Plant identification via AI (Edge Function)
- Pixel art generation for discovered plants
- Location-based discovery with map view
- Seasonal plant availability (spring set: 60 plants)
- Collection and herbarium management
- Social sharing with custom poster generation

## Project Structure

```
src/
├── app/          Expo Router pages (auth, tabs, plant detail)
├── components/   UI components
├── constants/    Theme colors, plant counts, quotas
├── hooks/        Custom React hooks
├── i18n/         Translation files (ja/en)
├── services/     Supabase client, auth, anti-cheat
├── stores/       Zustand stores
└── utils/        Date, geo, validation helpers

supabase/
├── functions/    Edge Functions (identify, pixelate, verify)
├── migrations/   SQL migrations
└── seed/         Plant seed data
```

## Documentation

See [docs/INDEX.md](docs/INDEX.md) for full documentation navigation:
- Product spec, competitive analysis, design system
- Launch preparation, ASO metadata
- Operations guides, monitoring baseline
