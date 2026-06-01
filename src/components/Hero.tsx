import { useEffect, useRef, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { useTheme } from '../theme'

import heroBgAurora from '../assets/hero-bg-aurora.png'
import heroBgSunset from '../assets/hero-bg-sunset.png'
import heroBgMatrix from '../assets/hero-bg-matrix.png'
import heroBgRose   from '../assets/hero-bg-rose.png'

const THEME_IMAGES: Record<string, string> = {
  aurora: heroBgAurora,
  sunset: heroBgSunset,
  matrix: heroBgMatrix,
  rose:   heroBgRose,
}

const ROLES = [
  'macOS Tooling',
  'Middleware',
  'ML Explorers',
  'Great Software'
]

function Typewriter({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showCursor, setShowCursor] = useState(true)

  const speed = deleting ? 40 : 80

  useEffect(() => {
    const current = words[index % words.length]
    let timer: ReturnType<typeof setTimeout>

    if (!deleting) {
      if (text.length < current.length) {
        timer = setTimeout(() => setText(current.slice(0, text.length + 1)), speed)
      } else {
        timer = setTimeout(() => setDeleting(true), 2000)
      }
    } else {
      if (text.length > 0) {
        timer = setTimeout(() => setText(current.slice(0, text.length - 1)), speed)
      } else {
        setDeleting(false)
        setIndex(i => i + 1)
      }
    }
    return () => clearTimeout(timer)
  }, [text, deleting, index, words, speed])

  useEffect(() => {
    const cursorTimer = setInterval(() => setShowCursor(v => !v), 500)
    return () => clearInterval(cursorTimer)
  }, [])

  return (
    <span className="text-gradient">
      {text}
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: '0.08em',
          height: '1em',
          backgroundColor: 'var(--brand)',
          marginLeft: '4px',
          verticalAlign: 'middle',
          opacity: showCursor ? 1 : 0,
          transition: 'opacity 0.1s'
        }}
      />
    </span>
  )
}

interface Props {
  onOpenContact?: () => void
}

export function Hero({ onOpenContact }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { theme, mode } = useTheme()

  const heroBg   = THEME_IMAGES[theme.key] ?? heroBgAurora
  const isLight  = mode === 'light'

  const scrollDown = () => {
    const el = document.querySelector('#about')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="home" className="hero" aria-label="Hero section">
      {/* Background */}
      <div className="hero-bg" aria-hidden>
        <div
          className="hero-img-bg"
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: isLight ? 0.25 : 0.5,
            mixBlendMode: isLight ? 'multiply' : 'screen',
            filter: 'saturate(1.2)',
            transition: 'background-image 0.6s ease, opacity 0.4s ease',
          }}
        />
        {/* Fade overlay — adapts to dark/light */}
        <div
          className="hero-fade-overlay"
          style={{
            position: 'absolute', inset: 0,
            background: isLight
              ? 'linear-gradient(to bottom, rgba(243,244,248,0.3) 0%, rgba(243,244,248,0.75) 60%, rgba(243,244,248,1) 100%)'
              : 'linear-gradient(to bottom, rgba(5,5,15,0.3) 0%, rgba(5,5,15,0.65) 50%, rgba(5,5,15,1) 100%)',
          }}
        />
        <div className="grid-bg" style={{ opacity: isLight ? 0.2 : 0.5 }} />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </div>

      {/* Content */}
      <div className="hero-content" ref={scrollRef}>
        {/* Badge */}
        <div className="hero-badge" role="status" aria-label="Available for collaborations">
          <div className="status-dot">
            <div className="dot-pulse" />
            <div className="dot-core" />
          </div>
          <span className="badge-text">Available for collaborations</span>
        </div>

        {/* Title */}
        <h1 className="hero-heading">
          Building <br />
          <Typewriter words={ROLES} />
          <br />
          with intent.
        </h1>

        {/* Sub */}
        <p className="hero-sub">
          I'm <strong>Pumudu Anuradha</strong> — a full-stack engineer from{' '}
          <strong>Colombo, Sri Lanka</strong>, a 3rd year undergraduate at UCSC. I build middleware,
          macOS tooling, and ML-powered web apps — and I open-source most of what I create.
        </p>

        {/* Actions */}
        <div className="hero-actions">
          <a
            href="#work"
            className="btn-primary"
            id="hero-view-work"
            onClick={e => { e.preventDefault(); document.querySelector('#work')?.scrollIntoView({ behavior: 'smooth' }) }}
          >
            View Work <span aria-hidden>→</span>
          </a>
          <button
            className="btn-secondary"
            id="hero-contact"
            onClick={onOpenContact}
          >
            Get in touch
          </button>
          <a
            href="https://github.com/Anuradhapumudu"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            id="hero-github"
            aria-label="Visit GitHub profile"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
            </svg>
            GitHub
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        className="hero-scroll"
        onClick={scrollDown}
        id="hero-scroll-indicator"
        aria-label="Scroll down"
        style={{ cursor: 'pointer', background: 'none', border: 'none' }}
      >
        <div className="hero-scroll-line" aria-hidden />
        <ArrowDown size={14} aria-hidden />
        <span>Scroll</span>
      </button>
    </section>
  )
}
