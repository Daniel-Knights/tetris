# Copilot Instructions

## Project Overview

This is a Tetris clone that ships as both a **web app** (PWA deployed to Netlify) and a **desktop app** (via [Tauri v2](https://v2.tauri.app/)). The frontend is a React + TypeScript SPA; the desktop shell is a thin Rust/Tauri wrapper.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 6, Zustand (state management) |
| Styling | Tailwind CSS 3, PostCSS |
| Build | Vite 8 |
| Desktop | Tauri 2 (Rust) |
| Package manager | pnpm 11.4 (required, enforced via `packageManager` field) |
| Node | >=22 |

## Repository Layout

```
src/                  # React/TypeScript frontend source
  classes/            # Core domain models (Coord, Tetromino, GameStatus)
  components/         # React UI components
  hooks/              # Game logic hooks (controls, drop, rotation, scoring, store)
  resources/          # Static game data (tetromino shapes)
  utils/              # Shared utilities (events, timers, shuffle)
  constant.ts         # Global constants (matrix dimensions)
src-tauri/            # Tauri/Rust desktop shell
  src/lib.rs          # Tauri plugin registration
  src/main.rs         # Entry point
  Cargo.toml          # Rust dependencies
  tauri.conf.json     # Tauri configuration
scripts/              # Release automation (tsx scripts)
public/               # Static assets for web build (PWA manifest, service worker)
artwork/              # App icons and artwork source files
```

## Development Commands

```bash
# Install dependencies (always use pnpm)
pnpm install

# Run lint + type-check (the standard validation step)
pnpm run checks        # Runs: pnpm run lint && tsc --noEmit

# Individual checks
pnpm run lint          # ESLint (flat config: eslint.config.mjs)
pnpm tsc --noEmit      # TypeScript type checking

# Development servers
pnpm run dev           # Tauri desktop dev (requires Rust toolchain + system deps)
pnpm run dev:web       # Web-only dev server (no Rust required) — port 3000

# Build
pnpm run build         # Full Tauri desktop build (checks + Rust compile)
pnpm run build:web     # Web-only build → ./dist-web/

# Format
pnpm run format        # Prettier on ./src
```

## Important Notes for Agents

### No Test Suite

This project currently has **no automated tests**. There is no test script or test framework configured. Validation is limited to linting and type-checking via `pnpm run checks`.

### Web vs Desktop Builds

The app environment is determined at build time via `process.env.APP_ENV`:
- `"desktop"` — Tauri build (`vite.config.ts`)
- `"web"` — Web/PWA build (`vite.config.web.ts`)

Platform-specific code uses the `env.ts` utility to check the environment.

### Tauri Desktop Build Prerequisites

Running `pnpm run dev` or `pnpm run build` requires:
- Rust toolchain (1.96+)
- System dependencies (Ubuntu: `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`)

For frontend-only work, use `pnpm run dev:web` which needs only Node/pnpm.

### State Management

Game state lives in a single Zustand store (`src/hooks/store.ts`). The game loop, input handling, scoring, and piece logic are all in `src/hooks/`.

### Code Style & Conventions

- **Prettier** handles formatting (config: `.prettierrc`). Print width 90, double quotes, trailing commas (es5).
- **Import ordering** is enforced by `@trivago/prettier-plugin-sort-imports`.
- **ESLint** uses a flat config with strict rules including: no `++`, no `for...in`, `eqeqeq`, `prefer-const`, `prefer-template`, `no-param-reassign`, etc.
- **TypeScript** is strict (`strict: true`, `noUnusedLocals`, `noUncheckedIndexedAccess`, `noImplicitReturns`).
- Use function declarations or arrow functions (no `var`, prefer `const`).
- Commits follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

### CI / Release

- The only CI workflow is `.github/workflows/release.yml`, triggered on version tags (`v*`).
- Releases are managed via `pnpm run release:patch|minor|major` which bumps versions and creates tags.
- Changelog is generated with `changenog` using Angular commit conventions.

### Common Errors & Workarounds

- **`pnpm run dev` fails without Rust**: Use `pnpm run dev:web` for frontend development.
- **ESLint `no-plusplus` rule**: Use `+= 1` or `- 1` instead of `++`/`--`.
- **`no-param-reassign`**: Clone or create new objects instead of mutating function parameters.
- **`noUncheckedIndexedAccess`**: Array/object index access may be `undefined`; add explicit checks or use non-null assertion (`!`) when certain.
