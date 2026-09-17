# Spin the Weel

Vite + TypeScript project.

## Scripts

| Script            | What it does                                        |
| ----------------- | --------------------------------------------------- |
| `npm run serve`   | Dev server on http://localhost:5173                 |
| `npm run build`   | Production build into `dist`                        |
| `npm run preview` | Serves the built `dist` on http://localhost:4173    |
| `npm run format`  | Rewrites files with Prettier                        |
| `npm run check`   | Prettier check, then ESLint + Stylelint, then `tsc` |

`check` also runs as the Husky `pre-commit` hook, so a commit is aborted if any step fails.
