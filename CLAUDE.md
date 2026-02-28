# CLAUDE.md - Project Context for Claude

## Project Overview

This is Bill Bergquist's personal website built with Astro, React 19, and TypeScript. It uses Astro's static site generation (SSG) with React Islands for interactive components.

## Tech Stack

- **Astro** - Static site generator with file-based routing
- **React 19** - Interactive components (islands) hydrated client-side
- **TypeScript 5.7** - Type safety
- **Prettier** - Code formatting
- **Netlify** - Hosting and form processing

## Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
├── astro.config.mjs        # Astro configuration
├── tsconfig.json            # TypeScript configuration (extends astro/tsconfigs/strict)
├── vitest.config.ts         # Test configuration
├── public/                  # Static assets (favicons, robots.txt, sitemap.xml)
└── src/
    ├── layouts/
    │   └── Layout.astro     # Main layout (head, meta, navbar, footer)
    ├── pages/               # File-based routing (.astro files)
    │   ├── index.astro      # Home page
    │   ├── about.astro
    │   ├── projects.astro
    │   ├── services.astro
    │   ├── 404.astro
    │   └── arcade/
    │       ├── index.astro
    │       └── descent.astro
    ├── components/
    │   ├── layout/          # Navbar.astro, Footer.astro, ScrollProgress.tsx (island)
    │   ├── home/            # Hero.tsx (island), section components (.astro)
    │   ├── about/           # ExperienceTimeline.astro, SkillsSection.astro
    │   ├── projects/        # ProjectCard.astro
    │   ├── services/        # ContactForm.tsx (island)
    │   └── ui/              # GlowText, Button, Card, SectionDivider (.astro + .tsx)
    ├── games/               # Minesweeper roguelike (full React app)
    ├── scripts/
    │   └── scroll-reveal.ts # Vanilla JS IntersectionObserver
    └── styles/
        ├── global.css       # Global styles and CSS variables
        └── reset.css        # CSS reset
```

## Architecture Notes

- **Astro pages** render as static HTML at build time — all content is in the HTML source
- **React Islands** are used only for interactive components:
  - `Hero.tsx` — typewriter animation (`client:load`)
  - `ScrollProgress.tsx` — scroll progress bar (`client:load`)
  - `ContactForm.tsx` — form with submit handling (`client:visible`)
  - `MinesweeperRoguelikePage.tsx` — full game (`client:only="react"`, no SSR)
- **CSS Modules** are shared between Astro and React components
- **JSON-LD** structured data is rendered in `<script>` tags in the HTML head
- **Netlify Forms** detection works because the form HTML is pre-rendered at build time

## Writing Style

- **Never use emdashes** in content copy. They are a dead giveaway for AI-generated text. Use periods, commas, colons, or restructure the sentence instead. Emdashes in HTML title attributes (like "Bill Bergquist — Engineer") are acceptable since those are metadata separators.
- Keep writing natural and conversational. Avoid overly polished, formulaic patterns.

## Development Notes

- **NEVER start the dev server** - it is always running during sessions and HMR handles updates automatically
- Development server runs on http://localhost:4321
- Code formatting follows Prettier config in `.prettierrc.json`
- Production build outputs to `dist/` folder
- Each page generates its own HTML file (no SPA fallback needed)

## Git Workflow

**IMPORTANT: Never push directly to `main`. All changes go through `staging` first.**

### Branch Strategy

- `main` - Production branch. Deploys to Netlify. **Do not push directly.**
- `staging` - Integration branch. All PRs target this branch.
- Feature branches - Created from `staging` for individual changes.

### Branch Naming

Use descriptive, kebab-case branch names with optional prefixes:

```
feature/add-portfolio-section
fix/mobile-layout-bug
update/react-version
refactor/component-structure
```

### Development Workflow

1. **Start from staging:**
   ```bash
   git checkout staging
   git pull origin staging
   git checkout -b feature/my-feature
   ```

2. **Make changes and commit**

3. **Create PR targeting `staging`** (not main):
   ```bash
   gh pr create --base staging
   ```

4. **After PR is merged to staging**, changes accumulate until ready for production.

5. **Production deploy** (done manually by maintainer):
   - Merge `staging` → `main` triggers Netlify deploy
   - This batches multiple features into a single deploy to conserve build credits

### PR Guidelines

- Always target `staging` as the base branch
- Use clear, descriptive PR titles
- Include a summary of changes in the PR description
