#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const OWNER = process.env.GH_PAGES_OWNER || 'louispaulet'
const LIMIT = Number.parseInt(process.env.GH_PAGES_LIMIT || '20', 10)
const APP_PATH = resolve(process.cwd(), 'src/App.tsx')

function runGhApi(path) {
  return JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))
}

function monitoredSites() {
  const source = readFileSync(APP_PATH, 'utf8')
  const match = source.match(/const SITES = \[([\s\S]*?)\]/)
  if (!match) {
    throw new Error(`Could not find the SITES array in ${APP_PATH}`)
  }
  return [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1])
}

function normalizeUrl(value) {
  try {
    const parsed = new URL(value)
    parsed.hash = ''
    parsed.search = ''
    parsed.hostname = parsed.hostname.toLowerCase()
    if (!parsed.pathname.endsWith('/')) parsed.pathname += '/'
    return parsed.toString()
  } catch {
    return null
  }
}

function hostname(value) {
  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return null
  }
}

function repoSlug(repoName) {
  return repoName.toLowerCase().replaceAll('_', '-')
}

function hostSlug(host) {
  return host.replace('.thefrenchartist.dev', '').replace('.louispaulet.github.io', '').toLowerCase()
}

function pageCandidates(repo, page) {
  const candidates = new Set()
  if (page.html_url) candidates.add(page.html_url)
  if (page.cname) candidates.add(`https://${page.cname}/`)

  const defaultPath = repo.name === `${OWNER}.github.io` ? '/' : `/${repo.name}/`
  candidates.add(`https://${OWNER}.github.io${defaultPath}`)

  return [...candidates]
}

function isMonitored(repo, candidates, monitored) {
  const candidateUrls = candidates.map(normalizeUrl).filter(Boolean)
  const candidateHosts = candidates.map(hostname).filter(Boolean)
  const normalizedRepoSlug = repoSlug(repo.name)

  return (
    candidateUrls.some((url) => monitored.urls.has(url)) ||
    candidateHosts.some((host) => monitored.hosts.has(host)) ||
    monitored.slugs.has(normalizedRepoSlug)
  )
}

function formatRows(rows) {
  const repoWidth = Math.max('repo'.length, ...rows.map((row) => row.repo.length))
  const urlWidth = Math.max('page'.length, ...rows.map((row) => row.url.length))

  const header = `${'repo'.padEnd(repoWidth)}  ${'page'.padEnd(urlWidth)}  updated`
  const divider = `${'-'.repeat(repoWidth)}  ${'-'.repeat(urlWidth)}  -------`
  const body = rows.map((row) => `${row.repo.padEnd(repoWidth)}  ${row.url.padEnd(urlWidth)}  ${row.updatedAt}`)

  return [header, divider, ...body].join('\n')
}

async function main() {
  if (!Number.isFinite(LIMIT) || LIMIT < 1) {
    throw new Error('GH_PAGES_LIMIT must be a positive number')
  }

  const sites = monitoredSites()
  const monitored = {
    urls: new Set(sites.map(normalizeUrl).filter(Boolean)),
    hosts: new Set(sites.map(hostname).filter(Boolean)),
    slugs: new Set(sites.map(hostname).filter(Boolean).map(hostSlug)),
  }

  const repos = runGhApi(`/users/${OWNER}/repos?per_page=${LIMIT}&sort=updated&direction=desc&type=public`)
  const missing = []

  for (const repo of repos) {
    let page
    try {
      page = runGhApi(`/repos/${OWNER}/${repo.name}/pages`)
    } catch {
      continue
    }

    if (page.status !== 'built') continue

    const candidates = pageCandidates(repo, page)
    if (isMonitored(repo, candidates, monitored)) continue

    missing.push({
      repo: repo.name,
      url: candidates[0],
      updatedAt: repo.updated_at,
    })
  }

  if (missing.length === 0) {
    console.log(`No unmonitored active GitHub Pages found in the latest ${LIMIT} public repos for ${OWNER}.`)
    return
  }

  console.log(`Unmonitored active GitHub Pages in the latest ${LIMIT} public repos for ${OWNER}:`)
  console.log(formatRows(missing))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
