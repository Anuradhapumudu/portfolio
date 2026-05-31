import { useState, useEffect } from 'react'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { THEMES, useTheme } from '../theme'

const links = [
  { href: '#home',    label: 'Home'    },
  { href: '#about',   label: 'About'   },
  { href: '#work',    label: 'Work'    },
  { href: '#stack',   label: 'Stack'   },
  { href: '#contact', label: 'Contact' },
]

interface Props {
  onOpenContact?: () => void
}

export function Nav({ onOpenContact }: Props) {
  const [open,    setOpen]    = useState(false)
  const [active,  setActive]  = useState('#home')
  const [scrolled, setScrolled] = useState(false)
  const { theme, setThemeKey, mode, toggleMode } = useTheme()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sections = links.map(l => document.querySelector(l.href))
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(`#${e.target.id}`) }),
      { threshold: 0.5 }
    )
    sections.forEach(s => s && observer.observe(s))
    return () => observer.disconnect()
  }, [])

  const handleLink = (href: string) => {
    setOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  const isDark = mode === 'dark'

  return (
    <header
      className="nav"
      style={{
        background: scrolled
          ? isDark ? 'rgba(5,5,15,0.9)'  : 'rgba(248,249,252,0.92)'
          : isDark ? 'rgba(5,5,15,0.4)'  : 'rgba(248,249,252,0.5)',
      }}
    >
      <div className="nav-inner">
        {/* Logo */}
        <a
          href="#home"
          className="nav-logo"
          onClick={e => { e.preventDefault(); handleLink('#home') }}
          id="nav-logo"
          aria-label="Go to top"
        >
          <span className="text-gradient" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>PA</span>
          <span style={{ color: 'var(--text-muted)' }}>/2026</span>
        </a>

        {/* Desktop nav */}
        <nav className="nav-links" aria-label="Main navigation">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              id={`nav-link-${l.label.toLowerCase()}`}
              className={`nav-link${active === l.href ? ' active' : ''}`}
              onClick={e => { e.preventDefault(); handleLink(l.href) }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right controls */}
        <div className="nav-cta">
          {/* Theme Colour Swatches */}
          <div className="theme-switcher hidden-mobile" style={{ display: 'flex', gap: '6px', marginRight: '4px' }}>
            {THEMES.map(t => (
              <button
                key={t.key}
                onClick={() => setThemeKey(t.key)}
                aria-label={`Theme: ${t.label}`}
                title={t.label}
                style={{
                  width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer',
                  background: t.swatch,
                  border: theme.key === t.key ? '2px solid var(--text)' : '1px solid var(--border)',
                  boxShadow: theme.key === t.key ? '0 0 0 2px var(--bg)' : 'none',
                  transition: 'transform 0.2s',
                  flexShrink: 0,
                }}
                onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                onMouseOut={e =>  (e.currentTarget.style.transform = 'scale(1)')}
              />
            ))}
          </div>

          {/* Dark / Light toggle */}
          <button
            id="mode-toggle"
            onClick={toggleMode}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            className="mode-toggle-btn hidden-mobile"
          >
            {isDark
              ? <Sun  size={16} style={{ color: '#fbbf24' }} />
              : <Moon size={16} style={{ color: '#6366f1' }} />
            }
          </button>

          <button className="nav-hire-btn" id="nav-hire-btn" onClick={onOpenContact}>
            Hire me ✦
          </button>

          {/* Mobile toggle */}
          <button
            className="nav-mobile-toggle"
            id="nav-mobile-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="nav-mobile-menu" role="menu">
          {/* Colour swatches */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem', justifyContent: 'center' }}>
            {THEMES.map(t => (
              <button
                key={t.key}
                onClick={() => { setThemeKey(t.key); setOpen(false) }}
                title={t.label}
                style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: t.swatch,
                  border: theme.key === t.key ? '2px solid var(--text)' : '1px solid var(--border)',
                }}
              />
            ))}
          </div>

          {/* Mode toggle (mobile) */}
          <button
            onClick={() => { toggleMode(); setOpen(false) }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              color: 'var(--text)', background: 'var(--surface)', fontSize: '0.85rem',
            }}
          >
            {isDark ? <><Sun size={14} /> Switch to Light Mode</> : <><Moon size={14} /> Switch to Dark Mode</>}
          </button>

          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className={`nav-link${active === l.href ? ' active' : ''}`}
              style={{ fontSize: '1rem', textAlign: 'center' }}
              onClick={e => { e.preventDefault(); handleLink(l.href) }}
              role="menuitem"
            >
              {l.label}
            </a>
          ))}
          <button
            className="btn-primary"
            style={{ justifyContent: 'center', marginTop: '0.5rem' }}
            onClick={() => { setOpen(false); onOpenContact?.() }}
          >
            Get in Touch
          </button>
        </div>
      )}
    </header>
  )
}
