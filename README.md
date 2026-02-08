# billbergquist.com

Bill Bergquist's personal website featuring a neon arcade aesthetic with interactive games and professional portfolio content.

## Overview

A personal portfolio site with a retro-futuristic arcade theme, showcasing professional experience, skills, and interactive browser-based games. Built as a modern single-page application with React 19 and TypeScript 5, with games developed through AI-assisted workflows using Claude Code.

**Live Site:** [billbergquist.com](https://billbergquist.com)

## Technology Stack

- **Framework:** React 19
- **Language:** TypeScript 5.7
- **Build Tool:** Vite 6
- **Routing:** React Router v7
- **Validation:** Zod 4
- **Styling:** CSS Modules with custom neon/arcade theme
- **Fonts:** Google Fonts (Orbitron, Space Grotesk, JetBrains Mono)
- **Testing:** Vitest 4 + Testing Library + jsdom
- **Linting:** ESLint 9 (flat config) with React Hooks and React Refresh plugins
- **Formatting:** Prettier 3
- **Deployment:** Netlify
- **PWA:** Web manifest with custom icons

## Features

### Portfolio Content

- **Hero Section** -- Animated neon title with call-to-action
- **About Section** -- Professional summary and introduction
- **Experience Timeline** -- Career history and achievements
- **Skills Section** -- Technical skills and expertise
- **Education** -- Purdue University, BS Computer Engineering (2006-2010)

### Interactive Arcade

The site includes a dedicated arcade section, highlighting games built through AI-assisted development and agentic workflows.

**Minesweeper: Descent** -- A roguelike twist on classic minesweeper with deep progression mechanics:

- **10 Floors** of escalating mine density (6x6 up to 12x12 boards)
- **19 Power-Ups** across 4 rarity tiers (Common, Uncommon, Rare, Epic) with both passive and active abilities
- **Draft System** -- Choose from weighted random power-up options after clearing each floor
- **Ascension System** -- 5 post-victory difficulty modifiers that stack cumulatively:
  - A1: Cold Start (no guaranteed first-click cascade)
  - A2: Narrow Draft (2 power-up choices instead of 3)
  - A3: Mine Pressure (+15% mine density)
  - A4: Amnesia (numbers fade after 8 seconds)
  - A5: Toroidal (board wraps at edges)
- **Meta-Progression** -- Persistent stats tracking (best floor, best score, floors cleared, ascension progress)
- **Save/Resume** -- localStorage persistence with Zod schema validation, versioned migrations, and checksum integrity
- **Mobile Optimized** -- Responsive board layouts with portrait-oriented configurations
- **Arcade Cabinet UI** -- CRT scanline effects, vignette, pause/reset controls

### Design

- Neon/cyberpunk aesthetic with glowing text effects
- Responsive layout with smooth animations
- Custom UI components (GlowText, Button, Card, GameCard)
- Arcade Cabinet wrapper component with retro CRT screen effects
- Dark theme optimized for the arcade experience
- Error boundary and 404 pages with consistent styling

## Project Structure

```
src/
├── components/
│   ├── about/                 # About page components
│   │   ├── ExperienceTimeline.tsx
│   │   └── SkillsSection.tsx
│   ├── arcade/                # Arcade UI components
│   │   ├── ArcadeCabinet.tsx  # CRT cabinet wrapper with scanlines/controls
│   │   └── index.ts
│   ├── home/                  # Home page components
│   │   ├── Hero.tsx
│   │   ├── AboutSection.tsx
│   │   └── GameGrid.tsx
│   ├── layout/                # Layout components
│   │   ├── Layout.tsx
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── ui/                    # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       └── GlowText.tsx
├── games/                     # Game implementations
│   └── minesweeper-roguelike/
│       ├── components/        # Game-specific UI components
│       │   ├── Board.tsx
│       │   ├── Cell.tsx
│       │   ├── ExplosionOverlay.tsx
│       │   ├── FloorClearOverlay.tsx
│       │   ├── GameToast.tsx
│       │   ├── IronWillSaveOverlay.tsx
│       │   ├── PauseOverlay.tsx
│       │   ├── PowerUpDraft.tsx
│       │   ├── RelicsPopover.tsx
│       │   ├── RoguelikeHeader.tsx
│       │   ├── RunOverScreen.tsx
│       │   ├── StartScreen.tsx
│       │   └── icons/         # SVG icon components
│       ├── hooks/             # Game state management
│       │   ├── useRoguelikeState.ts
│       │   ├── useRoguelikeStats.ts
│       │   ├── useContainerWidth.ts
│       │   └── useIsMobile.ts
│       ├── logic/             # Core game logic (UI-independent)
│       │   ├── gameLogic.ts
│       │   └── roguelikeLogic.ts
│       ├── persistence/       # Save/load with versioned migrations
│       │   ├── storage.ts
│       │   ├── schemas.ts     # Zod validation schemas
│       │   ├── migrations.ts
│       │   └── index.ts
│       ├── ascension.ts       # Ascension difficulty modifiers
│       ├── constants.ts       # Floor configs, power-ups, scoring
│       ├── types.ts           # TypeScript type definitions
│       ├── MinesweeperRoguelike.tsx
│       ├── MinesweeperRoguelikePage.tsx
│       ├── MinesweeperRoguelikePreview.tsx
│       └── index.ts
├── pages/                     # Route page components
│   ├── HomePage.tsx
│   ├── AboutPage.tsx
│   ├── ArcadePage.tsx
│   ├── ErrorPage.tsx
│   └── NotFoundPage.tsx
├── styles/                    # Global styles
│   ├── animations.css
│   ├── global.css
│   ├── reset.css
│   └── variables.css
├── test-setup.ts              # Vitest setup (Testing Library cleanup)
├── router.tsx                 # React Router configuration
└── main.tsx                   # Application entry point
```

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | HomePage | Hero, about section, featured game |
| `/about` | AboutPage | Experience timeline, skills, education |
| `/arcade` | ArcadePage | Game collection with previews |
| `/arcade/descent` | MinesweeperRoguelikePage | Minesweeper: Descent (in arcade cabinet) |
| `*` | NotFoundPage | 404 page |

All routes include error boundaries via `ErrorPage`.

## Development

### Prerequisites

- Node.js >= 24 (see `.nvmrc`)
- npm >= 11

### Installation

```bash
npm install
```

### Start Development Server

```bash
npm start
# or
npm run dev
```

Opens at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Outputs optimized production build to `dist/`.

### Preview Production Build

```bash
npm run preview
```

### Run Tests

```bash
npm test           # Single run
npm run test:watch # Watch mode
```

Tests use Vitest with jsdom environment and Testing Library for component testing.

### Lint

```bash
npm run lint
```

Uses ESLint 9 flat config with TypeScript, React Hooks, and React Refresh plugins.

## Deployment

The site is deployed on Netlify with automatic deployments from the `main` branch.

**Configuration:**

- Build command: `npm run build`
- Publish directory: `dist`
- SPA routing: All routes redirect to `index.html` (configured in `netlify.toml`)

### Git Workflow

All changes go through the `staging` branch before merging to `main`:

1. Create feature branch from `staging`
2. Open PR targeting `staging`
3. After merge, changes accumulate in staging
4. Production deploy: merge `staging` into `main` (triggers Netlify build)

See `CLAUDE.md` for detailed branch naming conventions and workflow steps.

## Adding New Games

Games follow a feature-based architecture pattern with the Arcade Cabinet wrapper:

1. Create game folder in `src/games/[game-name]/`
2. Structure:
   - `components/` -- Game-specific UI components
   - `hooks/` -- Game state management
   - `logic/` -- Core game logic separate from UI
   - `persistence/` -- Save/load with schema validation (optional)
   - `types.ts` -- TypeScript type definitions
   - `constants.ts` -- Game configuration and constants
   - `[GameName].tsx` -- Main game component
   - `[GameName]Page.tsx` -- Full-page wrapper (renders inside `ArcadeCabinet`)
   - `[GameName]Preview.tsx` -- Preview component for the arcade game grid
   - `index.ts` -- Public exports
3. Add route in `src/router.tsx` under the `arcade/` path
4. Add game card to `src/pages/ArcadePage.tsx`

See `src/games/minesweeper-roguelike/` for the reference implementation.

## Code Style

- **Formatting:** Prettier (configured in `.prettierrc.json`)
- **Linting:** ESLint 9 flat config (`eslint.config.js`)
- **TypeScript:** Strict mode enabled with `noUnusedLocals` and `noUnusedParameters`
- **Naming:** PascalCase for components, camelCase for utilities
- **Styling:** CSS Modules for component styles, global styles in `src/styles/`
- **Testing:** Co-located test files (`*.test.ts` / `*.test.tsx`) alongside source

## License

Private project -- All rights reserved.

## Contact

- **GitHub:** [titomb345](https://github.com/titomb345)
- **LinkedIn:** [bill-bergquist](https://www.linkedin.com/in/bill-bergquist/)
- **Buy Me a Coffee:** [titomb345](https://buymeacoffee.com/titomb345)
