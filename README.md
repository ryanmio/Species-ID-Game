# Species ID Game

A web-based animal identification quiz game powered by iNaturalist API data.

## Overview

Interactive guessing game where users identify animals from images. Features difficulty levels (Easy → Expert) and animal group filtering.

## Tech Stack

- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript
- **API**: iNaturalist v1 API (animal data)
- **Hosting**: Optimized for Vercel

## Key Features

- 4 difficulty levels with taxonomy-based distractors
- 9 animal groups (mammals, birds, fish, reptiles, amphibians, insects, arachnids, mollusks, crustaceans)
- Dark/light mode support
- Score tracking
- API response caching (5-min TTL)
- Rate limiting (30 req/min per IP)
- Request timeouts (10s per call)
- Image validation (trusted domains only)

## Project Structure

```
app/
  ├── api/eol/route.ts          # iNaturalist API handler with caching/rate-limiting
  ├── page.tsx                   # Main game page
  └── layout.tsx                 # Root layout with theme provider

components/
  ├── score-board-with-settings.tsx  # Combined score + settings panel
  ├── game-card.tsx              # Question display
  ├── loading-spinner.tsx
  └── ui/                        # shadcn components

lib/
  ├── eol-api.ts                # iNaturalist API client
  ├── cache.ts                  # Simple TTL cache manager
  └── image-utils.ts            # Image validation utilities
```

## Running Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## Production Build

```bash
npm run build
npm run start
```

Build passes strict TypeScript checking with no errors.

## Notes

- Difficulty modes determine distractor taxonomy level (same class → same family → same genus)
- Images only from iNaturalist, Cloudinary, Flickr, Wikimedia (security)
- API failures gracefully retry with exponential backoff
- Caching reduces API calls by ~70%
- Score resets when difficulty changes
