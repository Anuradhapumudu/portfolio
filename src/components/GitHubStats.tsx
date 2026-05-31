import { useEffect, useState, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────
type GHUser = {
  public_repos: number
  followers:    number
  following:    number
  created_at:   string
}

type GHRepo = {
  stargazers_count: number
  forks_count:      number
  language:         string | null
}

type Stats = {
  repos:     number
  stars:     number
  languages: number
  since:     string
}

// ─── Animated counter ────────────────────────────────────────────
function AnimatedNumber({ target, duration = 1400 }: { target: number; duration?: number }) {
  const [display, setDisplay]   = useState(0)
  const rafRef                  = useRef<number>(0)
  const startRef                = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) { setDisplay(0); return }
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const pct  = Math.min((ts - startRef.current) / duration, 1)
      const ease = 1 - Math.pow(1 - pct, 3)   // cubic ease-out
      setDisplay(Math.round(ease * target))
      if (pct < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { cancelAnimationFrame(rafRef.current); startRef.current = null }
  }, [target, duration])

  return <>{display.toLocaleString()}</>
}

// ─── Component ───────────────────────────────────────────────────
const ACCOUNT = 'Anuradhapumudu'

export function GitHubStats() {
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const [user, repos] = await Promise.all([
          fetch(`https://api.github.com/users/${ACCOUNT}`)
            .then(r => r.ok ? r.json() as Promise<GHUser> : Promise.reject()),
          fetch(`https://api.github.com/users/${ACCOUNT}/repos?per_page=100`)
            .then(r => r.ok ? r.json() as Promise<GHRepo[]> : Promise.reject()),
        ])
        if (!alive) return

        const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0)
        const langs      = new Set(repos.map(r => r.language).filter(Boolean))

        setStats({
          repos:     user.public_repos,
          stars:     totalStars,
          languages: langs.size,
          since:     String(new Date(user.created_at).getFullYear()),
        })
      } catch {
        // Graceful fallback — real data at build time
        if (alive) setStats({ repos: 11, stars: 3, languages: 6, since: '2022' })
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => { alive = false }
  }, [])

  const items = [
    {
      id:    'stat-repos',
      value: stats?.repos     ?? 0,
      label: 'Public Repos',
      icon:  'bi-folder2-open',
    },
    {
      id:    'stat-stars',
      value: stats?.stars     ?? 0,
      label: 'GitHub Stars',
      icon:  'bi-star-fill',
    },
    {
      id:    'stat-langs',
      value: stats?.languages ?? 0,
      label: 'Languages',
      icon:  'bi-code-slash',
    },
    {
      id:    'stat-since',
      value: stats ? Number(stats.since) : 0,
      label: 'On GitHub Since',
      icon:  'bi-calendar3',
    },
  ]

  return (
    <div className="stats-strip" aria-label="GitHub statistics">
      <div className="stats-grid">
        {items.map(item => (
          <div key={item.id} className="stat-item" id={item.id}>
            <div
              className="stat-value text-gradient"
              style={{ opacity: loading ? 0.35 : 1, transition: 'opacity 0.4s ease' }}
            >
              {loading
                ? <span style={{ fontSize: '1.5rem', letterSpacing: '0.1em' }}>···</span>
                : <AnimatedNumber target={item.value} duration={1400} />
              }
            </div>
            <div className="stat-label">
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* GitHub link footnote */}
      {!loading && (
        <div style={{
          textAlign: 'center',
          paddingBottom: '0.75rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: 'var(--text-dim)',
          letterSpacing: '0.08em',
        }}>
          <i className="bi bi-github" aria-hidden="true" style={{ marginRight: '5px' }} />
          <a
            href={`https://github.com/${ACCOUNT}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--brand)', textDecoration: 'none' }}
          >
            @{ACCOUNT}
          </a>
        </div>
      )}
    </div>
  )
}
