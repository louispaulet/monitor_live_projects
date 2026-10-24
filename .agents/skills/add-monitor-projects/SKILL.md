---
name: add-monitor-projects
description: Find and add public GitHub Pages projects with live websites to the monitor_live_projects dashboard.
---

# Add Monitor Projects

Use this skill when refreshing the projects listed in this repository's monitoring dashboard.

## Workflow

1. Read the repository's `agents.md` and inspect the current `SITES` array in `src/App.tsx`.
2. Run `make upate`. It uses `gh` to inspect recent public repositories for `louispaulet` and lists repositories with a built GitHub Pages deployment whose site is not already monitored. GitHub Pages project URLs can share the `louispaulet.github.io` host, so compare their full paths instead of treating a shared host as the same site. Set `GH_PAGES_LIMIT=100` before the command to scan up to 100 recent repositories.
3. Confirm each candidate is public from the GitHub API result and that its reported Pages URL is live. Follow redirects and check for a successful response, for example with `curl --location --fail --silent --show-error --output /dev/null --max-time 20 '<url>'`. Do not add private repositories, failed Pages deployments, or URLs that do not respond successfully.
4. Add only verified, currently unmonitored URLs to the `SITES` array. Preserve the existing URL style and avoid duplicates, including a project already monitored through a custom domain.
5. Update the README if the discovery workflow or project count documentation needs it. Follow `agents.md` for validation, commits, and pushing to the upstream branch.

If `gh` is unavailable or unauthenticated, report that discovery could not be completed; do not guess project URLs.
