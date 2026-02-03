# billbergquist.com

Bill Bergquist's personal website featuring a neon arcade aesthetic with interactive games and professional portfolio content.

## Overview

A personal portfolio site with a retro-futuristic arcade theme, showcasing professional experience, skills, and interactive browser-based games. Built as a modern single-page application with React 19 and TypeScript 5.

**Live Site:** [billbergquist.com](https://billbergquist.com)

## Technology Stack

- **Framework:** React 19
- **Language:** TypeScript 5.7
- **Build Tool:** Vite 6
- **Routing:** React Router v7
- **Styling:** CSS Modules with custom neon/arcade theme
- **Fonts:** Google Fonts (Orbitron, Space Grotesk, JetBrains Mono)
- **Deployment:** Netlify
- **PWA:** Web manifest with custom icons

## Features

### Portfolio Content
- **Hero Section** - Animated neon title with call-to-action
- **About Section** - Professional summary and introduction
- **Experience Timeline** - Career history and achievements
- **Skills Section** - Technical skills and expertise
- **Education** - Purdue University, BS Computer Engineering (2006-2010)

### Interactive Arcade
- **Minesweeper** - Classic puzzle game with multiple difficulty levels (Beginner, Intermediate, Expert)
- Feature-based game architecture designed for easy addition of new games

### Design
- Neon/cyberpunk aesthetic with glowing text effects
- Responsive layout with smooth animations
- Custom UI components (GlowText, Button, Card)
- Dark theme optimized for the arcade experience

## Project Structure

```
src/
├── components/
│   ├── about/              # About page components
│   │   ├── ExperienceTimeline.tsx
│   │   └── SkillsSection.tsx
│   ├── home/               # Home page components
│   │   ├── Hero.tsx
│   │   ├── AboutSection.tsx
│   │   └── GameGrid.tsx
│   ├── layout/             # Layout components
│   │   ├── Layout.tsx
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── ui/                 # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       └── GlowText.tsx
├── games/                  # Game implementations
│   └── minesweeper/
│       ├── components/     # Game-specific components
│       ├── hooks/          # Game state management
│       ├── logic/          # Game logic
│       ├── types.ts
│       ├── Minesweeper.tsx
│       ├── MinesweeperPage.tsx
│       ├── MinesweeperPreview.tsx
│       └── index.ts
├── pages/                  # Route page components
│   ├── HomePage.tsx
│   └── AboutPage.tsx
├── styles/                 # Global styles
│   ├── animations.css
│   ├── global.css
│   ├── reset.css
│   └── variables.css
├── router.tsx              # React Router configuration
└── main.tsx                # Application entry point
```

## Routes

- `/` - Home page (hero, about, game grid)
- `/about` - Full about page with experience and skills
- `/minesweeper` - Minesweeper game

## Development

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

Outputs optimized production build to `/dist`

### Preview Production Build

```bash
npm run preview
```

## Deployment

The site is deployed on Netlify with automatic deployments from the main branch.

**Configuration:**
- Build command: `npm run build`
- Publish directory: `dist`
- SPA routing: All routes redirect to `index.html` (configured in `netlify.toml`)

## Adding New Games

Games follow a feature-based architecture pattern:

1. Create game folder in `src/games/[game-name]/`
2. Structure:
   - `components/` - Game-specific UI components
   - `hooks/` - Game state management (e.g., `useGameState.ts`)
   - `logic/` - Core game logic separate from UI
   - `types.ts` - TypeScript type definitions
   - `[GameName].tsx` - Main game component
   - `[GameName]Page.tsx` - Full-page wrapper component
   - `[GameName]Preview.tsx` - Preview component for game grid
   - `index.ts` - Public exports
3. Add route in `src/router.tsx`
4. Add game card to `src/components/home/GameGrid.tsx`

See `src/games/minesweeper/` for reference implementation.

## Code Style

- **Formatting:** Prettier (configured in `.prettierrc.json`)
- **TypeScript:** Strict mode enabled
- **Naming:** PascalCase for components, camelCase for utilities
- **Styling:** CSS Modules for component styles, global styles in `/src/styles`

## License

Private project - All rights reserved.

## Contact

- **GitHub:** [titomb335](https://github.com/titomb335)
- **LinkedIn:** [bill-bergquist](https://www.linkedin.com/in/bill-bergquist/)
