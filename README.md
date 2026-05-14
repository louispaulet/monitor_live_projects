# monitor_live_projects

A Vite + React + TailwindCSS dashboard for monitoring TheFrenchArtist sites.

## What it does

- Checks a list of live sites through a Cloudflare Worker HEAD checker
- Treats HTTP `200` as healthy
- Shows a 6-column square tile layout on desktop
- Caches results locally for 5 minutes
- Uses `HashRouter` so GitHub Pages refreshes work safely

## Development

```bash
make up
```

You can override the port:

```bash
make up PORT=5174
```

## Test

```bash
make test
```

## Build

```bash
make build
```

## Deploy

```bash
make deploy
```

Deploy publishes the `dist/` folder to GitHub Pages and includes:

- `dist/CNAME` with `monitor.thefrenchartist.dev`
- `dist/.nojekyll`

## Frontend

- `src/App.tsx` contains the main dashboard UI and status logic
- `src/main.tsx` mounts the app and wraps it in `HashRouter`
- `src/index.css` provides the global Tailwind entrypoint and base theme
- The layout intentionally keeps the original square tile system and 6-column grid
- The dashboard includes:
  - hero/header area
  - summary stat cards
  - status filters
  - cached/fresh check metadata
  - square status tiles

## Backend contract

The frontend expects a GET endpoint at `HEAD_CHECKER_ENDPOINT`.

Current endpoint:

```txt
https://head-checker.louispaulet13.workers.dev/
```

The frontend calls it like this:

```txt
GET https://head-checker.louispaulet13.workers.dev/?url=<target-url>
```

Expected response shape:

```json
{
  "status": 200
}
```

Rules used by the frontend:

- `status === 200` -> green / healthy
- any other status -> red / unhealthy
- fetch failure or checker error -> red / unhealthy

## Operating rules

- Always commit and push after every change, even on `main`
- Keep the frontend aligned with the dashboard reference HTML in `poc/`
- Keep GitHub Pages deployment compatible with HashRouter
