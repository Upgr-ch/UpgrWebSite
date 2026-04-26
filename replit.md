# UpGrade Learning & Development

A French-language marketing landing page for UpGrade, a Learning & Development consulting firm. The site presents the company's mission, solutions, methodology, team, and contact details.

## Architecture

- **Frontend**: React 19 + react-router-dom, built with Create React App and customized through Craco. Uses Tailwind CSS, Radix UI primitives, and shadcn-style components in `frontend/src/components/ui`.
- **Backend** (optional, currently unused by the frontend): FastAPI + Motor (MongoDB) in `backend/server.py`. Exposes a sample `/api/status` endpoint.

## Project Layout

```
frontend/      # React app (CRA + Craco)
  src/
    components/   # Page sections + shadcn UI primitives
    pages/        # Additional routes (e.g. /eugene)
    App.js        # Router and homepage composition
backend/       # FastAPI service (not currently called from the UI)
  server.py
  requirements.txt
```

## Development

- The `Frontend` workflow runs `yarn start` from the `frontend/` directory and serves the dev build on port 5000.
- The dev server binds to `0.0.0.0` and disables host checking via `DANGEROUSLY_DISABLE_HOST_CHECK=true` so the Replit preview iframe can reach it.
- Frontend dependencies were installed with `bun install` (which produced a working `node_modules`); `yarn` is used at runtime to invoke `craco start` / `craco build`.

## Environment Variables

`frontend/.env`
- `HOST=0.0.0.0`
- `PORT=5000`
- `DANGEROUSLY_DISABLE_HOST_CHECK=true`
- `WDS_SOCKET_PORT=0`
- `BROWSER=none`
- `REACT_APP_BACKEND_URL=` (unused by the current UI)

`backend/.env`
- `MONGO_URL=mongodb://localhost:27017`
- `DB_NAME=app_database`
- `CORS_ORIGINS=*`

## Deployment

Configured as a **static** deployment:
- Build: `cd frontend && yarn install && yarn build`
- Public dir: `frontend/build`

## Notes from import setup

- Removed the `@emergentbase/visual-edits` dependency from `frontend/package.json` because the tarball URL stalled package resolution; `frontend/craco.config.js` already handles its absence with a try/catch.
- Removed the `emergentintegrations` Python dependency from `backend/requirements.txt` because it is not published on PyPI and is not imported by `server.py`.
- Removed the `packageManager` field from `frontend/package.json` so non-yarn package managers can install cleanly.
