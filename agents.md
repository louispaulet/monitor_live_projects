# Agents Guide

This file documents everything important about the frontend, backend contract, deployment, and workflow for this repository.

## Mandatory workflow

- Always commit and push after every change, even when working on the `main` branch.
- Prefer small, focused commits.
- Never leave the repository in a changed-but-uncommitted state after completing a task.

## Frontend overview

This repository is a Vite + React + TailwindCSS application.

### Key files

- `src/App.tsx`
  - Main dashboard UI
  - Fetches site health through the checker endpoint
  - Reads and writes a 5-minute localStorage cache
  - Supports filtering by status
  - Preserves the original six-column square tile layout
  - Includes an `/about` route for router validation

- `src/main.tsx`
  - React entrypoint
  - Wraps the app in `HashRouter`

- `src/index.css`
  - Tailwind base styles
  - Global background/theme styling

- `poc/head-checker-dashboard-6x6-square-with-urls.html`
  - Original HTML reference
  - Used as the visual/UX source of truth

### Frontend behavior

- Desktop layout uses a 6-column square grid
- Mobile layout collapses gracefully to fewer columns
- Status tiles show:
  - project label
  - full site URL
  - HTTP status or checker error text
  - green/red health indicator
- A button triggers a forced refresh
- Results are cached for 5 minutes in `localStorage`

### Routing

- The app uses `HashRouter`
- This is required so GitHub Pages refreshes and direct route access do not break
- Home route: `#/`
- About route: `#/about`

### Styling system

- TailwindCSS is the primary styling system
- The palette intentionally mirrors the original HTML dashboard
- Cards use glassy dark panels, rounded corners, and subtle borders

## Backend contract

The frontend does not implement the checker itself.
It expects a backend checker endpoint with the following behavior.

### Endpoint

Current endpoint:

```txt
https://head-checker.louispaulet13.workers.dev/
```

### Request shape

The frontend sends:

```txt
GET <endpoint>?url=<target-site-url>
```

### Expected response

JSON response containing a numeric `status` field.

Example:

```json
{
  "status": 200
}
```

### Health interpretation

- `200` means the site is healthy and tiles show green
- any other value means unhealthy and tiles show red
- network failures or checker failures also count as unhealthy

## Environment / configuration

- The checker endpoint is currently hardcoded in `src/App.tsx`
- If the endpoint changes, update it there
- GitHub Pages deployment writes a `CNAME` file for:

```txt
monitor.thefrenchartist.dev
```

## Build and deployment

### Make targets

- `make up`
  - starts the local Vite dev server
- `make kill`
  - stops local Vite preview/dev processes used by this project
- `make test`
  - runs the build as a validation step
- `make build`
  - runs `npm run build`
- `make deploy`
  - builds the app
  - writes `dist/CNAME`
  - writes `dist/.nojekyll`
  - publishes `dist/` with `gh-pages`

### GitHub Pages notes

- Deployment uses `gh-pages`
- `HashRouter` is required
- `public/CNAME` is part of the repo source and should match the custom domain

## Project intent

This project is a polished monitoring dashboard for the TheFrenchArtist site fleet.
It should stay visually faithful to the original HTML POC while being a real React app.
