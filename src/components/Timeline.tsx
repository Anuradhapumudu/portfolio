import { useReveal } from '../hooks/useReveal'

const EVENTS = [
  {
    date:  'May 2022',
    title: 'Joined GitHub',
    desc:  'Started publishing code openly — first steps into the open-source community.',
    color: '#10b981',
  },
  {
    date:  'Aug 2025',
    title: 'FarmerConnect',
    desc:  'Shipped my first full-stack PHP project at UCSC — connecting Sri Lankan farmers with buyers.',
    color: '#06b6d4',
  },
  {
    date:  'Feb 2026',
    title: 'SwiftLogistics Middleware',
    desc:  'Dived into enterprise architecture: SOAP, REST, event-driven design.',
    color: '#7c3aed',
  },
  {
    date:  'Mar 2026',
    title: 'CeylonProxy',
    desc:  'Built a lightweight web proxy utility for developer tooling and network inspection.',
    color: '#f472b6',
  },
  {
    date:  'May 2026',
    title: 'GestureKit + IINA Sinhala',
    desc:  'Crossed into Swift macOS development — trackpad APIs and full Sinhala localization.',
    color: '#f59e0b',
  },
  {
    date:  '2026 →',
    title: 'Entering Machine Learning',
    desc:  'Exploring Python ML — classification, neural networks, and intelligent systems.',
    color: '#8b5cf6',
  },
]

function TimelineRow({ event, index }: { event: typeof EVENTS[number]; index: number }) {
  const { ref, shown } = useReveal<HTMLLIElement>()
  const isLeft = index % 2 === 0

  return (
    <li
      ref={ref}
      className={`timeline-item${shown ? '' : ' hidden'}`}
      style={{ transitionDelay: `${index * 80}ms` }}
      id={`timeline-item-${index}`}
    >
      {/* Left content (even items) */}
      <div className={isLeft ? 'timeline-content-left' : ''} aria-hidden={!isLeft}>
        {isLeft && (
          <>
            <div className="timeline-date" style={{ color: event.color }}>{event.date}</div>
            <h3 className="timeline-event-title">{event.title}</h3>
            <p className="timeline-event-desc">{event.desc}</p>
          </>
        )}
      </div>

      {/* Center dot */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          className="timeline-dot"
          style={{ background: event.color, boxShadow: `0 0 16px ${event.color}80` }}
          aria-hidden
        />
      </div>

      {/* Right content (odd items) */}
      <div className={!isLeft ? 'timeline-content-right' : ''} aria-hidden={isLeft}>
        {!isLeft && (
          <>
            <div className="timeline-date" style={{ color: event.color }}>{event.date}</div>
            <h3 className="timeline-event-title">{event.title}</h3>
            <p className="timeline-event-desc">{event.desc}</p>
          </>
        )}
      </div>
    </li>
  )
}

export function Timeline() {
  const { ref, shown } = useReveal<HTMLElement>()

  return (
    <section
      ref={ref}
      aria-label="Timeline of milestones"
      style={{ paddingBlock: 'var(--section-py)', paddingInline: 'var(--px)' }}
    >
      {/* Header */}
      <div className={`timeline-header reveal${shown ? ' visible' : ''}`}>
        <p className="section-label">Journey</p>
        <h2 className="timeline-title">
          Years of{' '}
          <span className="text-gradient">shipping</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '1.0625rem', lineHeight: 1.7, maxWidth: '40ch', marginInline: 'auto' }}>
          From my first commit to building macOS tools — here's the story so far.
        </p>
      </div>

      <div className="timeline-wrap">
        <div className="timeline-line" aria-hidden />
        <ul className="timeline-list">
          {EVENTS.map((e, i) => (
            <TimelineRow key={e.title} event={e} index={i} />
          ))}
        </ul>
      </div>
    </section>
  )
}
