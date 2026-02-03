# CLAUDE.md - Project Context for Claude

## Project Overview

This is Bill Bergquist's personal website built with React 19, TypeScript 5, and Vite.

## Tech Stack

- **React 19** - UI framework
- **TypeScript 5.7** - Type safety
- **Vite 6** - Build tool and dev server
- **Prettier** - Code formatting

## Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
├── index.html      # HTML entry point
├── vite.config.ts  # Vite configuration
├── tsconfig.json   # TypeScript configuration
├── public/
│   └── favicon.ico # Static assets
└── src/
    ├── main.tsx    # App entry point
    ├── App.tsx     # Main app component
    └── index.css   # Global styles
```

## Development Notes

- **NEVER start the dev server** - it is always running during sessions and HMR handles updates automatically
- Development server runs on http://localhost:5173
- Code formatting follows Prettier config in `.prettierrc.json`
- Production build outputs to `dist/` folder

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
