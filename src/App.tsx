import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'

type SiteResult = {
  url: string
  status: number | string | null
  up: boolean
}

type CachePayload = {
  checkedAt: number
  results: SiteResult[]
}

const HEAD_CHECKER_ENDPOINT = 'https://head-checker.louispaulet13.workers.dev/'
const CACHE_KEY = 'thefrenchartist-status-cache-v1'
const CACHE_TTL_MS = 5 * 60 * 1000

const SITES = [
  'https://timeline.thefrenchartist.dev/',
  'https://hatvp.thefrenchartist.dev/',
  'https://timeline_old.thefrenchartist.dev/',
  'https://wunderwiki.thefrenchartist.dev/',
  'https://easy-recipes.thefrenchartist.dev/',
  'https://character-relationships.thefrenchartist.dev/',
  'https://city-builder.thefrenchartist.dev/',
  'https://facemap.thefrenchartist.dev/',
  'https://ponzi.thefrenchartist.dev/',
  'https://pretty-cats.thefrenchartist.dev/',
  'https://ratp.thefrenchartist.dev/',
  'https://groq-allin.thefrenchartist.dev/',
  'https://exquisite-menus.thefrenchartist.dev/',
  'https://genweb.thefrenchartist.dev/',
  'https://exquisite-menus-old.thefrenchartist.dev/',
  'https://hotpepperz.thefrenchartist.dev/',
  'https://mnist.thefrenchartist.dev/',
  'https://karaoke-light.thefrenchartist.dev/',
  'https://hatvp-dataviz.thefrenchartist.dev/',
  'https://seamless.thefrenchartist.dev/',
  'https://link-list.thefrenchartist.dev/',
  'https://paranormal.thefrenchartist.dev/',
  'https://crossrefnews.thefrenchartist.dev/',
  'https://qag-viewer.thefrenchartist.dev/',
  'https://conway.thefrenchartist.dev/',
  'https://gpt-reco.thefrenchartist.dev/',
  'https://hatvp-rag.thefrenchartist.dev/',
  'http://repsums.thefrenchartist.dev/',
  'https://louispaulet.github.io/',
  'http://face-classifier.thefrenchartist.dev/',
  'http://bernard.thefrenchartist.dev/',
  'http://monitor.thefrenchartist.dev/',
  'https://louispaulet.github.io/fraud_tinder/',
]

function hostnameLabel(url: string) {
  return new URL(url).hostname
}

function projectLabel(url: string) {
  return hostnameLabel(url).replace('.thefrenchartist.dev', '').split('-').join(' ')
}

function formatCheckedAt(timestamp: number) {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(timestamp))
}

function readCache(): CachePayload | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachePayload
    if (!parsed.checkedAt || !Array.isArray(parsed.results)) return null
    if (Date.now() - parsed.checkedAt > CACHE_TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(results: SiteResult[]) {
  const payload: CachePayload = { checkedAt: Date.now(), results }
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  return payload
}

async function checkSite(url: string): Promise<SiteResult> {
  const checkerUrl = new URL(HEAD_CHECKER_ENDPOINT)
  checkerUrl.searchParams.set('url', url)
  try {
    const response = await fetch(checkerUrl.toString(), { method: 'GET', cache: 'no-store' })
    if (!response.ok) return { url, status: `checker ${response.status}`, up: false }
    const payload = (await response.json()) as { status?: number }
    const status = payload.status ?? null
    return { url, status, up: status === 200 }
  } catch {
    return { url, status: 'fetch error', up: false }
  }
}

export default function App() {
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === ''
  const [results, setResults] = useState<SiteResult[]>([])
  const [loading, setLoading] = useState(true)
  const [checkedAt, setCheckedAt] = useState<number | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [filter, setFilter] = useState<'all' | 'up' | 'down'>('all')

  const counts = useMemo(() => {
    const up = results.filter((r) => r.up).length
    return { up, down: results.length - up }
  }, [results])

  const visibleResults = useMemo(() => {
    if (filter === 'up') return results.filter((r) => r.up)
    if (filter === 'down') return results.filter((r) => !r.up)
    return results
  }, [filter, results])

  const runCheck = useCallback(async (force = false) => {
    if (!force) {
      const cached = readCache()
      if (cached) {
        setResults(cached.results)
        setCheckedAt(cached.checkedAt)
        setFromCache(true)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    setFromCache(false)
    const checked = await Promise.all(SITES.map(checkSite))
    const cached = writeCache(checked)
    setResults(cached.results)
    setCheckedAt(cached.checkedAt)
    setLoading(false)
  }, [])

  useEffect(() => {
    document.title = isHome ? 'TheFrenchArtist status' : 'Monitor live projects'
  }, [isHome])

  useEffect(() => {
    void runCheck()
  }, [runCheck])

  return (
    <Routes>
      <Route
        path="/"
        element={
          <main className="mx-auto w-[min(1180px,calc(100%-32px))] py-12 pb-16">
            <header className="mb-7 flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-panel/70 px-5 py-4 backdrop-blur-md max-md:flex-col max-md:items-start">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-accent">TheFrenchArtist monitor</p>
                <div className="flex items-center gap-3 text-sm text-muted">
                  <Link className="font-bold text-text no-underline" to="/">
                    Dashboard
                  </Link>
                  <span>•</span>
                  <Link className="font-bold text-text no-underline" to="/about">
                    About
                  </Link>
                </div>
              </div>
              <div className="text-sm text-muted">HashRouter enabled for GitHub Pages</div>
            </header>

            <section className="mb-7 flex items-start justify-between gap-6 max-md:flex-col">
              <div>
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.08em] text-accent">POC dashboard</p>
                <h1 className="m-0 text-[clamp(2.2rem,5vw,4.6rem)] font-black leading-[0.96] tracking-[-0.055em]">
                  TheFrenchArtist<br />site status
                </h1>
                <p className="mt-4 max-w-[720px] text-base leading-7 text-muted">
                  Checks each site through your existing HEAD checker, marks it green only for HTTP <strong>200</strong>,
                  and keeps the visual DNA of the original six-column grid.
                </p>
              </div>

              <div className="min-w-[220px] space-y-3 max-md:w-full">
                <button
                  className="w-full rounded-full bg-text px-5 py-4 font-extrabold text-[#111318] transition hover:-translate-y-px disabled:cursor-wait disabled:opacity-70"
                  disabled={loading}
                  onClick={() => void runCheck(true)}
                >
                  {loading ? 'Checking…' : 'Force refresh'}
                </button>
                <div className="text-right text-sm leading-6 text-muted max-md:text-left">
                  {checkedAt ? `${fromCache ? 'Loaded from cache' : 'Fresh check'} · ${formatCheckedAt(checkedAt)}` : 'Waiting for the first check…'}
                </div>
              </div>
            </section>

            <section className="mb-5 grid gap-3 rounded-[28px] border border-white/10 bg-panel/90 p-[18px] shadow-glow backdrop-blur-md md:grid-cols-4">
              <Stat label="Total sites" value={SITES.length} />
              <Stat label="HTTP 200" value={results.length ? counts.up : '—'} valueClassName="text-green" />
              <Stat label="Not 200" value={results.length ? counts.down : '—'} valueClassName="text-red" />
              <Stat label="Checked" value={`${results.length}/${SITES.length}`} />
            </section>

            <section className="overflow-hidden rounded-[28px] border border-white/10 bg-panel/90 shadow-glow backdrop-blur-md">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-[18px] max-md:flex-col max-md:items-start">
                <div>
                  <strong className="block text-base">{checkedAt ? 'Status loaded' : 'No cached check yet'}</strong>
                  <span className="mt-1 block text-sm text-muted">Red means: no response, checker error, or any status other than 200.</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['all', 'All'],
                    ['up', 'Green'],
                    ['down', 'Red'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      className={`rounded-full border px-[13px] py-2 text-sm font-bold ${filter === value ? 'border-white bg-white text-[#111318]' : 'border-white/10 bg-transparent text-text'}`}
                      onClick={() => setFilter(value as 'all' | 'up' | 'down')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-6 gap-[clamp(4px,0.8vw,10px)] p-[clamp(8px,1.2vw,14px)] max-md:grid-cols-3 max-sm:grid-cols-2">
                {loading && results.length === 0
                  ? SITES.map((url) => <Tile key={url} url={url} status="loading" up={false} />)
                  : visibleResults.map((result) => <Tile key={result.url} {...result} />)}
              </div>
            </section>
          </main>
        }
      />
      <Route
        path="/about"
        element={
          <main className="mx-auto w-[min(980px,calc(100%-32px))] py-16">
            <header className="mb-7 flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-panel/70 px-5 py-4 backdrop-blur-md max-md:flex-col max-md:items-start">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-accent">TheFrenchArtist monitor</p>
                <div className="flex items-center gap-3 text-sm text-muted">
                  <Link className="font-bold text-text no-underline" to="/">
                    Dashboard
                  </Link>
                  <span>•</span>
                  <Link className="font-bold text-text no-underline" to="/about">
                    About
                  </Link>
                </div>
              </div>
              <div className="text-sm text-muted">HashRouter enabled for GitHub Pages</div>
            </header>

            <div className="rounded-[28px] border border-white/10 bg-panel/90 p-8 shadow-glow backdrop-blur-md">
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.08em] text-accent">About</p>
              <h1 className="m-0 text-4xl font-black tracking-[-0.05em]">HashRouter deployed to GitHub Pages</h1>
              <p className="mt-4 max-w-3xl text-muted">
                Louis Paulet builds sharp, public-facing AI and data tools that turn technical ideas into usable products, with a particular taste for benchmarks, civic transparency, and playful but serious web experiments.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <AboutCard
                  title="Applied AI with usable interfaces"
                  text="Retrieval tools, recommenders, browser ML, agent-style workspaces, and generative media projects — always wrapped in interfaces people can actually try."
                />
                <AboutCard
                  title="Data storytelling and public-interest tooling"
                  text="HATVP dashboards, transparency projects, benchmarks, and analytical writeups that make complex data easier to inspect and understand."
                />
                <AboutCard
                  title="Strong builder energy"
                  text="Prototype quickly, make it inspectable, and publish the thing. The work consistently favors live, testable builds over hidden experiments."
                />
              </div>

              <div className="mt-8 rounded-[20px] border border-white/10 bg-white/5 p-5 text-sm text-muted">
                <div className="font-bold text-text">What the portfolio signals</div>
                <ul className="mt-3 space-y-2 pl-5">
                  <li>Projects like Strange Wikipedia Atlas, Ponzi Simulator, Simple City Builder, Groq AllIn Studio, Exquisite Menus, MNIST in the browser, Maze Benchmark, Timeline Generator, and GPT YouTube Recommender support a coherent live-build narrative.</li>
                  <li>The blog reinforces that credibility through LLM benchmarks, browser inference, civic data tooling, retrieval systems, and AI product experiments.</li>
                </ul>
              </div>

              <div className="mt-6 rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm text-muted">
                <div className="font-bold text-text">Backend</div>
                <div className="mt-2">HEAD checker endpoint:</div>
                <code className="mt-2 inline-block rounded bg-white/10 px-1.5 py-0.5">{HEAD_CHECKER_ENDPOINT}</code>
              </div>
              <Link className="mt-6 inline-flex rounded-full bg-text px-5 py-3 font-bold text-[#111318]" to="/">
                Back home
              </Link>
            </div>
          </main>
        }
      />
    </Routes>
  )
}

function Tile({ url, status, up }: SiteResult) {
  return (
    <a href={url} target="_blank" rel="noreferrer noopener" className="group grid aspect-square min-w-0 grid-rows-[auto_1fr_auto] gap-[clamp(3px,0.55vw,8px)] overflow-hidden rounded-[clamp(10px,1.5vw,18px)] border border-white/10 bg-panel2 p-[clamp(5px,0.8vw,10px)] transition hover:-translate-y-0.5 hover:border-white/20">
      <div className="flex items-center justify-between gap-1 min-w-0">
        <span className={`h-[clamp(8px,1.15vw,13px)] w-[clamp(8px,1.15vw,13px)] rounded-full ${up ? 'bg-green shadow-[0_0_0_clamp(3px,0.45vw,5px)_rgba(53,208,127,0.13)]' : 'bg-yellow shadow-[0_0_0_clamp(3px,0.45vw,5px)_rgba(245,196,81,0.13)]'}`} />
        <span className="min-w-0 truncate text-[clamp(0.42rem,0.8vw,0.68rem)] font-black uppercase tracking-[0.03em] text-muted">
          {typeof status === 'number' ? status : status ?? 'error'}
        </span>
      </div>

      <div className="flex min-h-0 flex-col justify-center gap-[clamp(3px,0.45vw,6px)] overflow-hidden text-center">
        <span className="line-clamp-2 overflow-hidden text-[clamp(0.46rem,1.05vw,0.88rem)] font-black uppercase leading-[1.05] tracking-[-0.025em] text-text [overflow-wrap:anywhere]">
          {projectLabel(url)}
        </span>
        <span className="line-clamp-4 overflow-hidden text-[clamp(0.32rem,0.62vw,0.54rem)] font-semibold leading-[1.08] text-muted [overflow-wrap:anywhere] [word-break:break-word]">
          {url}
        </span>
      </div>

      <span className={`justify-self-center rounded-full bg-white/10 px-[clamp(4px,0.55vw,7px)] py-[clamp(2px,0.35vw,4px)] text-[clamp(0.36rem,0.68vw,0.58rem)] font-black uppercase tracking-[0.05em] ${up ? 'text-green' : 'text-red'}`}>
        {up ? 'HTTP 200' : 'Not 200'}
      </span>
    </a>
  )
}

function Stat({ label, value, valueClassName = '' }: { label: string; value: number | string; valueClassName?: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-panel2 p-[18px]">
      <span className="mb-2 block text-sm text-muted">{label}</span>
      <span className={`block text-[clamp(1.65rem,3vw,2.5rem)] font-black leading-none tracking-[-0.045em] ${valueClassName}`}>
        {value}
      </span>
    </div>
  )
}

function AboutCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-panel2 p-5">
      <h2 className="m-0 text-lg font-black tracking-[-0.03em] text-text">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{text}</p>
    </div>
  )
}
