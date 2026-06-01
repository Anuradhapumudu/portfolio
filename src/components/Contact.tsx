import { useState, FormEvent, useRef, useCallback } from 'react'
import { Mail, Linkedin, Twitter, Send, AlertCircle, CheckCircle, Clock, MapPin, ChevronDown } from 'lucide-react'
import { useReveal }          from '../hooks/useReveal'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

const SUBJECTS = [
  { value: 'general',       label: '💬 General Inquiry'    },
  { value: 'job',           label: '💼 Job Opportunity'     },
  { value: 'collaboration', label: '🤝 Collaboration'       },
  { value: 'freelance',     label: '🚀 Freelance Project'   },
  { value: 'other',         label: '📌 Other'               },
]

const SOCIALS = [
  {
    href:  'https://github.com/Anuradhapumudu',
    label: 'GitHub',
    id:    'contact-github',
    color: '#6e40c9',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
      </svg>
    ),
  },
  {
    href:  'mailto:pumudu820@gmail.com',
    label: 'Email',
    id:    'contact-email',
    color: '#ea4335',
    icon:  <Mail size={18} aria-hidden />,
  },
  {
    href:  'https://linkedin.com/in/anuradhapumudu',
    label: 'LinkedIn',
    id:    'contact-linkedin',
    color: '#0a66c2',
    icon:  <Linkedin size={18} aria-hidden />,
  },
  {
    href:  'https://twitter.com/anuradhapumudu',
    label: 'Twitter / X',
    id:    'contact-twitter',
    color: '#1d9bf0',
    icon:  <Twitter size={18} aria-hidden />,
  },
]

const MAX_CHARS = 1000

function useFormSubmit(onClose?: () => void) {
  const [status,   setStatus]   = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const { executeRecaptcha }    = useGoogleReCaptcha()

  const submit = useCallback(async (
    name: string, email: string, phone: string, message: string, subject: string
  ) => {
    setStatus('sending')
    setErrorMsg('')
    try {
      // reCAPTCHA is optional — if key not configured, send empty token
      let token = ''
      try {
        if (executeRecaptcha) {
          token = await executeRecaptcha('contact')
        }
      } catch {
        // reCAPTCHA failed silently — proceed without token
      }
      const res = await fetch(import.meta.env.VITE_WORKER_URL || 'https://pumudu-contact.pumudu820.workers.dev', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, phone, message, subject, token }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to send.')
      setStatus('sent')
      if (onClose) setTimeout(onClose, 3200)
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Unexpected error. Please try again.')
    }
  }, [executeRecaptcha, onClose])

  return { status, errorMsg, submit, reset: () => { setStatus('idle'); setErrorMsg('') } }
}

/* ─────────────────────────────────────────────────────────────────── */
/*  INLINE FORM (used in the Contact section)                          */
/* ─────────────────────────────────────────────────────────────────── */
function InlineContactForm() {
  const nameRef    = useRef<HTMLInputElement>(null)
  const emailRef   = useRef<HTMLInputElement>(null)
  const phoneRef   = useRef<HTMLInputElement>(null)
  const msgRef     = useRef<HTMLTextAreaElement>(null)
  const [subject, setSubject]   = useState(SUBJECTS[0].value)
  const [msgLen,  setMsgLen]    = useState(0)
  const [emailValid, setEmailValid] = useState<boolean | null>(null)
  const { status, errorMsg, submit } = useFormSubmit()

  const validateEmail = (v: string) =>
    setEmailValid(v.length > 0 ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) : null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit(
      nameRef.current?.value  ?? '',
      emailRef.current?.value ?? '',
      phoneRef.current?.value ?? '',
      msgRef.current?.value   ?? '',
      subject,
    )
  }

  if (status === 'sent') {
    return (
      <div className="inline-form-success animate-fade-up">
        <div className="success-ring">
          <CheckCircle size={36} />
        </div>
        <h3>Message sent! 🎉</h3>
        <p>Thanks for reaching out. I'll reply within 24 hours.</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Check your inbox — you'll get an auto-reply shortly.
        </p>
      </div>
    )
  }

  return (
    <form className="inline-contact-form" onSubmit={handleSubmit} noValidate>
      {status === 'error' && (
        <div className="form-error-banner animate-fade-up">
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Subject */}
      <div className="form-group">
        <label htmlFor="cf-subject">Subject</label>
        <div className="select-wrapper">
          <select
            id="cf-subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            disabled={status === 'sending'}
          >
            {SUBJECTS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="select-chevron" aria-hidden />
        </div>
      </div>

      {/* Name */}
      <div className="form-group">
        <label htmlFor="cf-name">Name <span className="required-star">*</span></label>
        <input
          type="text" id="cf-name" ref={nameRef}
          required placeholder="John Doe"
          disabled={status === 'sending'}
        />
      </div>

      {/* Email + Phone row */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="cf-email">
            Email <span className="required-star">*</span>
            {emailValid === true  && <CheckCircle   size={12} className="field-valid"   />}
            {emailValid === false && <AlertCircle   size={12} className="field-invalid" />}
          </label>
          <input
            type="email" id="cf-email" ref={emailRef}
            required placeholder="you@example.com"
            disabled={status === 'sending'}
            onBlur={e => validateEmail(e.target.value)}
            onChange={e => { if (emailValid !== null) validateEmail(e.target.value) }}
            style={{
              borderColor: emailValid === false ? 'var(--error-color)'
                         : emailValid === true  ? 'var(--success-color)'
                         : undefined
            }}
          />
        </div>
        <div className="form-group">
          <label htmlFor="cf-phone">Phone <span className="optional-label">(optional)</span></label>
          <input
            type="tel" id="cf-phone" ref={phoneRef}
            placeholder="+1 234 567 890"
            disabled={status === 'sending'}
          />
        </div>
      </div>

      {/* Message */}
      <div className="form-group">
        <label htmlFor="cf-message" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Message <span className="required-star">*</span></span>
          <span
            className="char-counter"
            style={{ color: msgLen > MAX_CHARS * 0.9 ? 'var(--brand-3)' : 'var(--text-muted)' }}
          >
            {msgLen}/{MAX_CHARS}
          </span>
        </label>
        <textarea
          id="cf-message" ref={msgRef}
          required rows={5}
          placeholder="Tell me about your project, idea, or just say hello…"
          disabled={status === 'sending'}
          maxLength={MAX_CHARS}
          onChange={e => setMsgLen(e.target.value.length)}
        />
      </div>

      <p className="recaptcha-notice">
        Protected by reCAPTCHA ·{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Privacy</a>
        {' & '}
        <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">Terms</a>
      </p>

      <button
        type="submit"
        className="btn-primary contact-submit-btn"
        disabled={status === 'sending'}
      >
        {status === 'sending' ? (
          <><span className="sending-spinner" aria-hidden /> Sending securely…</>
        ) : (
          <><Send size={16} aria-hidden /> Send Message</>
        )}
      </button>
    </form>
  )
}

/* ─────────────────────────────────────────────────────────────────── */
/*  CONTACT SECTION                                                    */
/* ─────────────────────────────────────────────────────────────────── */
interface Props {
  onOpenContact?: () => void
}

export function Contact({ onOpenContact: _onOpenContact }: Props) {
  const { ref, shown } = useReveal<HTMLElement>()

  return (
    <section
      id="contact"
      ref={ref}
      aria-label="Contact section"
      className="contact-section"
    >
      {/* Background orbs */}
      <div className="contact-orb"       aria-hidden />
      <div className="contact-orb-2"     aria-hidden />

      <div className={`contact-inner-v2 reveal${shown ? ' visible' : ''}`}>
        {/* ── Left column ── */}
        <div className="contact-left">
          <p className="section-label">Contact</p>
          <h2 className="contact-title">
            Let's{' '}<span className="text-gradient">build</span>
            <br />something great.
          </h2>

          <p className="contact-sub">
            Open to internships, collaborations, and interesting technical
            problems. I'm always up for a chat about systems, code, or Sri
            Lankan tech.
          </p>

          {/* Availability */}
          <div className="availability-badge">
            <span className="avail-dot" aria-hidden />
            <span>Available for opportunities</span>
          </div>

          {/* Response time */}
          <div className="response-info">
            <Clock size={14} aria-hidden />
            <span>Usually replies within 24 hours</span>
          </div>

          <div className="contact-location">
            <MapPin size={14} aria-hidden />
            <span>Colombo, Sri Lanka 🇱🇰</span>
          </div>

          {/* Social links */}
          <div className="contact-socials">
            {SOCIALS.map(s => (
              <a
                key={s.id}
                href={s.href}
                target={s.href.startsWith('http') ? '_blank' : undefined}
                rel={s.href.startsWith('http') ? 'noreferrer' : undefined}
                className="contact-social-link"
                id={s.id}
                aria-label={s.label}
                title={s.label}
                style={{ '--social-color': s.color } as React.CSSProperties}
              >
                {s.icon}
                <span>{s.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ── Right column: Inline Form ── */}
        <div className="contact-right">
          <div className="contact-form-card border-gradient">
            <div className="contact-form-card-header">
              <img
                src="https://avatars.githubusercontent.com/u/106007410?v=4"
                alt="Pumudu Anuradha"
                className="contact-form-avatar"
              />
              <div>
                <p className="contact-form-card-name">Pumudu Anuradha</p>
                <p className="contact-form-card-role">Full-Stack Engineer</p>
              </div>
            </div>
            <InlineContactForm />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="footer"
        role="contentinfo"
        style={{ maxWidth: 'var(--container)', marginInline: 'auto', marginTop: '4rem' }}
      >
        <p className="footer-copy">© 2026 Pumudu Anuradha · All rights reserved</p>
        <p className="footer-made">Crafted with ❤️ in Colombo, Sri Lanka</p>
      </footer>
    </section>
  )
}
