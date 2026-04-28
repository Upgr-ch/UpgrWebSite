# UpGrade Learning & Development

A French-language marketing landing page for UpGrade, a Learning & Development consulting firm. The site presents the company's mission, solutions, methodology, team, and contact details.

## Architecture

The project is now served as a **fully static site** built from the original React app.

- `index.html` (root) — entry point produced by `react-scripts build`
- `static/` — hashed JS/CSS/asset bundles
- `asset-manifest.json` — build manifest
- `server.js` — minimal Node.js static file server used by the Replit workflow (no caching, SPA fallback to `index.html`)

The original React source (`frontend/`, `src/`, `public/`) and the FastAPI backend (`backend/`, `tests/`, `test_reports/`) have been removed.

## Development

- The `Frontend` workflow runs `node server.js` and serves the static build on port 5000 (host `0.0.0.0`).
- `server.js` sends `Cache-Control: no-cache` so the Replit preview iframe always sees fresh content, and falls back to `index.html` for unknown paths (so React Router routes like `/eugene` still work).

## Deployment

Configured as a **static** deployment:
- Build: `cd frontend && yarn install && yarn build` (legacy entry — the build output is already at the project root)
- Public dir: `frontend/build`

> Note: since the project was flattened, you can also just publish the project root as static assets.

## History

- Imported from Replit Agent.
- Removed the `@emergentbase/visual-edits` dependency and `emergentintegrations` Python dependency that were unused / unresolvable.
- Built the React app with `npm run build` and moved the output to the project root, removed `backend/`, `tests/`, `test_reports/`, `frontend/`, `public/`, `src/`.
- Replaced the dev workflow (`yarn start`) with a small Node static server (`server.js`).
