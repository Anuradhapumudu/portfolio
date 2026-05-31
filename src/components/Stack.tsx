import { useReveal } from '../hooks/useReveal'

const GROUPS = [
  {
    title: 'Frontend',
    icon:  'bi-palette2',
    color: '#06b6d4',
    items: ['HTML & CSS', 'JavaScript', 'TypeScript', 'React', 'Vite'],
  },
  {
    title: 'Backend & Data',
    icon:  'bi-server',
    color: '#7c3aed',
    items: ['PHP', 'Node.js', 'SQL / PostgreSQL', 'REST APIs', 'SOAP / Middleware'],
  },
  {
    title: 'Systems & AI',
    icon:  'bi-cpu',
    color: '#f472b6',
    items: ['Swift / AppKit', 'Python', 'Machine Learning', 'Git / GitHub', 'Linux'],
  },
]

const MARQUEE = [
  'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React',
  'PHP', 'SQL', 'Python', 'Swift', 'macOS',
  'Node.js', 'REST', 'SOAP', 'Machine Learning', 'Git',
  'PostgreSQL', 'AppKit', 'Vite', 'Middleware', 'Linux',
]

export function Stack() {
  const { ref, shown } = useReveal<HTMLElement>()

  return (
    <section
      id="stack"
      ref={ref}
      aria-label="Technology stack"
      style={{ paddingBlock: 'var(--section-py)', paddingInline: 'var(--px)', position: 'relative', overflow: 'hidden' }}
    >
      {/* Ambient bg */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div className={`stack-header reveal${shown ? ' visible' : ''}`}>
        <p className="section-label">Capabilities</p>
        <h2 className="stack-title">
          A multi-disciplinary{' '}
          <span className="text-gradient">tech stack</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem', maxWidth: '42ch', marginInline: 'auto', fontSize: '1.0625rem', lineHeight: 1.7 }}>
          From pixel-perfect frontends to system-level Swift — I build across the full spectrum.
        </p>
      </div>

      {/* Cards */}
      <div className="stack-grid">
        {GROUPS.map((g, i) => (
          <StackCard key={g.title} group={g} delay={i * 100} />
        ))}
      </div>

      {/* Marquee */}
      <div className="marquee-wrap" aria-hidden>
        <div className="marquee-track animate-marquee">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} className="marquee-item">
              {item}
              <i className="bi bi-diamond-fill marquee-sep" aria-hidden />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function StackCard({
  group,
  delay,
}: {
  group: typeof GROUPS[number]
  delay: number
}) {
  const { ref, shown } = useReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      id={`stack-card-${group.title.toLowerCase().replace(/\s+/g, '-')}`}
      className={`stack-card reveal${shown ? ' visible' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Icon blob */}
      <div
        style={{
          width: '2.75rem',
          height: '2.75rem',
          borderRadius: '0.75rem',
          background: `${group.color}18`,
          color: group.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
        }}
        aria-hidden
      >
        <i className={`bi ${group.icon}`} style={{ fontSize: '1.35rem' }} />
      </div>

      <div className="stack-card-title" style={{ color: group.color }}>
        {group.title}
      </div>

      <ul className="stack-items">
        {group.items.map(item => (
          <li key={item} className="stack-item">
            <span
              className="stack-dot"
              style={{ background: group.color }}
              aria-hidden
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
