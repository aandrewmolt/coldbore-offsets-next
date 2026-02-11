# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains the Next.js App Router entry points (`layout.tsx`, `page.tsx`, `globals.css`).
- `components/` holds feature UI; `components/ui/` is for shadcn primitives, and `components/modals/` contains dialog flows.
- `hooks/` stores reusable client hooks (for uploads, autosave, keyboard shortcuts, drag/reorder, etc.).
- `lib/` contains shared logic and state (`store.ts` with Zustand, `types.ts`, storage/EXIF/export utilities).
- `public/` contains static and PWA assets (`manifest.json`, icons, `sw.js`).
- `e2e/` contains Playwright tests and screenshot artifacts.

## Build, Test, and Development Commands
- `npm run dev` starts local development server at `http://localhost:3000`.
- `npm run build` creates a production build.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint with Next.js core-web-vitals + TypeScript rules.
- `npx playwright test` runs end-to-end tests in `e2e/`.
- `npx playwright show-report` opens the Playwright HTML report.

## Coding Style & Naming Conventions
- Use TypeScript with strict typing (`tsconfig.json` has `"strict": true`).
- Match existing formatting: 2-space indentation, semicolons, and single quotes.
- Use kebab-case filenames for modules (`photo-grid.tsx`, `use-photo-upload.ts`).
- Use PascalCase for component exports and `use*` naming for hooks.
- Prefer `@/*` imports (e.g., `@/components/header`) over deep relative paths.
- Keep low-level reusable primitives in `components/ui/`; place feature composition in `components/`.

## Testing Guidelines
- Framework: Playwright (`@playwright/test`) with tests under `e2e/`.
- Test files should use `*.spec.ts` naming and clear scenario titles.
- Keep assertions deterministic; use screenshots to support regression checks.
- Before submitting changes, run: `npm run lint` and `npx playwright test`.

## Commit & Pull Request Guidelines
- Current history is minimal (`Initial commit from Create Next App`), so follow concise, imperative commit subjects (example: `Add map URL parsing guard`).
- Keep commits focused and include test updates for behavior changes.
- PRs should include: purpose, key files changed, validation steps, and UI screenshots when relevant.
- Link related issues/tasks and call out any follow-up work.
