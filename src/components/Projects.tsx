import { useRef, MouseEvent } from 'react'
import { useReveal } from '../hooks/useReveal'

interface Project {
  slug:    string
  name:    string
  desc:    string
  tag:     string
  date:    string
  icon:    string
  color:   string
  url:     string
  stack:   string[]
}

const PROJECTS: Project[] = [
  {
    slug:  'farmerconnect',
    name:  'FarmerConnect',
    desc:  'Full-stack PHP web platform connecting Sri Lankan farmers with buyers. Built at UCSC with a clean MVC architecture and MySQL database.',
    tag:   'Full-Stack',
    date:  'Aug 2025',
    icon:  'bi-flower1',
    color: '#10b981',
    url:   'https://github.com/Anuradhapumudu',
    stack: ['PHP', 'MySQL', 'HTML', 'CSS'],
  },
  {
    slug:  'swiftlogistics',
    name:  'SwiftLogistics Middleware',
    desc:  'Enterprise-grade middleware system supporting SOAP, REST, and event-driven communication. Designed for high-throughput logistics operations.',
    tag:   'Systems',
    date:  'Feb 2026',
    icon:  'bi-lightning-charge-fill',
    color: '#7c3aed',
    url:   'https://github.com/Anuradhapumudu',
    stack: ['SOAP', 'REST', 'Events', 'Java'],
  },
  {
    slug:  'ceylonproxy',
    name:  'CeylonProxy',
    desc:  'Lightweight web proxy utility with request filtering, caching, and logging. Designed for developer tooling and network inspection.',
    tag:   'Networking',
    date:  'Mar 2026',
    icon:  'bi-shuffle',
    color: '#06b6d4',
    url:   'https://github.com/Anuradhapumudu',
    stack: ['Python', 'HTTP', 'Sockets'],
  },
  {
    slug:  'gesturekit',
    name:  'GestureKit',
    desc:  'Swift macOS library exposing advanced trackpad gesture APIs — multi-finger swipes, pressure sensitivity, and custom gesture recognizers.',
    tag:   'macOS',
    date:  'May 2026',
    icon:  'bi-hand-index-thumb',
    color: '#f472b6',
    url:   'https://github.com/Anuradhapumudu',
    stack: ['Swift', 'AppKit', 'HID'],
  },
  {
    slug:  'iina-sinhala',
    name:  'IINA Sinhala',
    desc:  'Full Sinhala localization for IINA, the modern macOS media player. Bringing native language support to Sri Lankan users.',
    tag:   'Localization',
    date:  'May 2026',
    icon:  'bi-play-circle-fill',
    color: '#f59e0b',
    url:   'https://github.com/Anuradhapumudu',
    stack: ['Swift', 'i18n', 'macOS'],
  },
  {
    slug:  'ml-explorer',
    name:  'ML Explorer',
    desc:  'Python machine learning experiments — classification models, neural networks, and data visualization. My journey into AI and intelligent systems.',
    tag:   'Machine Learning',
    date:  '2026',
    icon:  'bi-robot',
    color: '#8b5cf6',
    url:   'https://github.com/Anuradhapumudu',
    stack: ['Python', 'scikit-learn', 'NumPy'],
  },
]

function TiltCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null)

  const onMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current
    if (!el) return
    const r  = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    const rx = (py - 0.5) * -10
    const ry = (px - 0.5) * 10
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(4px)`
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
  }

  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateZ(0)'
  }

  const { ref: revealRef, shown } = useReveal<HTMLDivElement>()

  return (
    <div
      ref={revealRef}
      className={`reveal${shown ? ' visible' : ''}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <a
        ref={ref}
        href={project.url}
        target="_blank"
        rel="noreferrer"
        id={`project-card-${project.slug}`}
        className="project-card"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        aria-label={`View ${project.name} on GitHub`}
        style={{ transition: 'border-color 0.3s ease', display: 'block' }}
      >
        <div
          className="project-icon"
          style={{ background: `${project.color}18`, color: project.color }}
          aria-hidden
        >
          <i className={`bi ${project.icon}`} style={{ fontSize: '1.35rem' }} />
        </div>

        {/* Top row */}
        <div className="project-card-top">
          <span
            className="project-tag"
            style={{ color: project.color, borderColor: `${project.color}40` }}
          >
            {project.tag}
          </span>
          <span className="project-date">{project.date}</span>
        </div>

        {/* Title */}
        <h3 className="project-title">{project.name}</h3>

        {/* Description */}
        <p className="project-desc">{project.desc}</p>

        {/* Footer */}
        <div className="project-footer">
          <div className="project-stack">
            {project.stack.map(s => (
              <span key={s} className="project-stack-tag">{s}</span>
            ))}
          </div>
          <div className="project-arrow">
            <span>View</span>
            <i className="bi bi-arrow-up-right" aria-hidden />
          </div>
        </div>
      </a>
    </div>
  )
}

export function Projects() {
  return (
    <section
      id="work"
      aria-label="Selected projects"
      style={{ paddingBlock: 'var(--section-py)', paddingInline: 'var(--px)' }}
    >
      {/* Header */}
      <div className="projects-header">
        <div>
          <p className="section-label">Selected Work</p>
          <h2 className="projects-title">
            Projects I've{' '}
            <span className="text-gradient">shipped</span>
          </h2>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          01 — {String(PROJECTS.length).padStart(2, '0')}
        </span>
      </div>

      {/* Grid */}
      <div className="projects-grid">
        {PROJECTS.map((p, i) => (
          <TiltCard key={p.slug} project={p} index={i} />
        ))}
      </div>
    </section>
  )
}
