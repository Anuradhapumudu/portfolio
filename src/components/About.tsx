import { useReveal } from '../hooks/useReveal'
import { MapPin, GraduationCap, Code2, Zap } from 'lucide-react'
import ucscLogo     from '../assets/ucsc-logo.png'
import richmondLogo from '../assets/richmond-logo.png'

const META = [
  { icon: MapPin,        label: 'Location',  value: 'Colombo, Sri Lanka'         },
  { icon: GraduationCap, label: 'Education', value: 'UCSC · 3rd Year'            },
  { icon: Code2,         label: 'Focus',     value: 'Full-stack · Systems · ML'  },
  { icon: Zap,           label: 'Status',    value: 'Open to opportunities'      },
]

const EDUCATION = [
  {
    id:     'ucsc',
    logo:   ucscLogo,
    name:   'University of Colombo School of Computing',
    degree: 'BSc (Hons) in Computer Science',
    year:   '3rd Year Undergraduate',
    color:  '#c0392b',
    href:   'https://ucsc.cmb.ac.lk/',
  },
  {
    id:     'richmond',
    logo:   richmondLogo,
    name:   'Richmond College, Galle',
    degree: 'Advanced Level — Mathematics Stream',
    year:   'Galle, Sri Lanka',
    color:  '#1a3a6b',
    href:   'https://www.richmondcollege.lk/',
  },
]

interface Props {
  onOpenContact?: () => void
}

export function About({ onOpenContact }: Props) {
  const { ref, shown } = useReveal<HTMLElement>()

  return (
    <section
      id="about"
      ref={ref}
      className={`reveal${shown ? ' visible' : ''}`}
      aria-label="About Pumudu Anuradha"
      style={{ paddingBlock: 'var(--section-py)', paddingInline: 'var(--px)' }}
    >
      <div className="about-grid">
        {/* Photo */}
        <div className="about-photo-wrap">
          <div className="about-photo-ring" aria-hidden />
          <div className="about-photo-frame border-gradient">
            <img
              src="https://avatars.githubusercontent.com/u/106007410?v=4"
              alt="Pumudu Anuradha — profile photo"
              loading="lazy"
              width={400}
              height={400}
            />
            <div className="about-photo-overlay" aria-hidden />
          </div>

          {/* Badge */}
          <div className="about-photo-badge" aria-hidden>
            <span style={{ color: '#10b981' }}>●</span>
            <span>Available · Colombo, LK</span>
          </div>
        </div>

        {/* Text */}
        <div>
          <p className="section-label">About</p>

          <h2 className="about-title">
            Versatile builder,{' '}
            <span className="text-gradient">curious learner.</span>
          </h2>

          <p className="about-body">
            I'm a <strong style={{ color: 'var(--text)' }}>3rd year undergraduate</strong> at the{' '}
            <a
              href="https://ucsc.cmb.ac.lk/"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}
            >
              University of Colombo School of Computing (UCSC)
            </a>
            , shipping projects across web, macOS, and machine learning. I love bridging
            low-level systems with intuitive interfaces — and I open-source most of what I build.
          </p>

          <p className="about-body">
            Recently I've been deep into{' '}
            <strong style={{ color: 'var(--brand-2)' }}>Swift trackpad APIs</strong>,{' '}
            <strong style={{ color: 'var(--brand)' }}>enterprise middleware patterns</strong>, and{' '}
            <strong style={{ color: 'var(--brand-3)' }}>Sinhala language tooling</strong> — pushing
            into territory where few developers have gone.
          </p>

          {/* Meta grid */}
          <div className="about-meta">
            {META.map(({ icon: Icon, label, value }) => (
              <div key={label} className="about-meta-item">
                <label>
                  <Icon size={10} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} aria-hidden />
                  {label}
                </label>
                <span>{value}</span>
              </div>
            ))}
          </div>

          {/* ── Education cards ── */}
          <div className="education-cards" aria-label="Education history">
            <div className="edu-section-label">
              <i className="bi bi-mortarboard-fill" aria-hidden="true" />
              <span>Education</span>
            </div>

            {EDUCATION.map(edu => (
              <a
                key={edu.id}
                href={edu.href}
                target="_blank"
                rel="noreferrer"
                className="edu-card"
                id={`edu-${edu.id}`}
                aria-label={`${edu.name} — ${edu.degree}`}
                style={{ '--edu-color': edu.color } as React.CSSProperties}
              >
                {/* Logo */}
                <div className="edu-logo-wrap" style={{ borderColor: `${edu.color}30` }}>
                  <img
                    src={edu.logo}
                    alt={`${edu.name} logo`}
                    className="edu-logo"
                  />
                </div>

                {/* Info */}
                <div className="edu-info">
                  <p className="edu-name">{edu.name}</p>
                  <p className="edu-degree">{edu.degree}</p>
                  <span
                    className="edu-year-tag"
                    style={{
                      color:       edu.color,
                      borderColor: `${edu.color}40`,
                      background:  `${edu.color}10`,
                    }}
                  >
                    {edu.year}
                  </span>
                </div>

                {/* Arrow */}
                <i className="bi bi-arrow-right edu-arrow" aria-hidden="true" />
              </a>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href="https://github.com/Anuradhapumudu"
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
              id="about-github-link"
              aria-label="View GitHub profile"
            >
              <i className="bi bi-github" aria-hidden="true" style={{ marginRight: '6px' }} />
              GitHub Profile
            </a>
            <button
              className="btn-secondary"
              id="about-email-link"
              onClick={onOpenContact}
            >
              <i className="bi bi-envelope" aria-hidden="true" style={{ marginRight: '6px' }} />
              Contact Me
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
