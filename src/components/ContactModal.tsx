import { useState, FormEvent, useRef, useCallback } from 'react'
import { X, Send, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

interface Props {
  isOpen:  boolean
  onClose: () => void
}

const SUBJECTS = [
  { value: 'general',       label: '💬 General Inquiry'  },
  { value: 'job',           label: '💼 Job Opportunity'   },
  { value: 'collaboration', label: '🤝 Collaboration'     },
  { value: 'freelance',     label: '🚀 Freelance Project' },
  { value: 'other',         label: '📌 Other'             },
]

const MAX_CHARS = 1000

export function ContactModal({ isOpen, onClose }: Props) {
  const [status,   setStatus]   = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [subject,  setSubject]  = useState(SUBJECTS[0].value)
  const [msgLen,   setMsgLen]   = useState(0)
  const [emailValid, setEmailValid] = useState<boolean | null>(null)
  const { executeRecaptcha } = useGoogleReCaptcha()

  const nameRef  = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const msgRef   = useRef<HTMLTextAreaElement>(null)

  const validateEmail = (v: string) =>
    setEmailValid(v.length > 0 ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) : null)

  const resetForm = useCallback(() => {
    setStatus('idle')
    setErrorMsg('')
    setSubject(SUBJECTS[0].value)
    setMsgLen(0)
    setEmailValid(null)
  }, [])

  const handleClose = () => { resetForm(); onClose() }

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!executeRecaptcha) {
      setErrorMsg('ReCAPTCHA has not loaded yet. Please refresh.')
      setStatus('error')
      return
    }
    setStatus('sending')
    setErrorMsg('')
    try {
      const token   = await executeRecaptcha('contact')
      const payload = {
        name:    nameRef.current?.value  ?? '',
        email:   emailRef.current?.value ?? '',
        phone:   phoneRef.current?.value ?? '',
        message: msgRef.current?.value   ?? '',
        subject,
        token,
      }
      const res  = await fetch(import.meta.env.VITE_WORKER_URL || 'https://pumudu-contact.pumudu820.workers.dev', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to send message.')
      setStatus('sent')
      setTimeout(() => { resetForm(); onClose() }, 3500)
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'An unexpected error occurred.')
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
      <div className="modal-content modal-content-v2 border-gradient" role="dialog" aria-modal="true" aria-labelledby="modal-heading">

        {/* Gradient top bar */}
        <div className="modal-gradient-bar" aria-hidden />

        {/* Close button */}
        <button className="modal-close" onClick={handleClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="modal-header-v2">
          <img
            src="https://avatars.githubusercontent.com/u/106007410?v=4"
            alt="Pumudu Anuradha"
            className="modal-avatar"
          />
          <div>
            <h2 id="modal-heading" className="modal-title">
              Get in <span className="text-gradient">Touch</span>
            </h2>
            <p className="modal-sub">Send me a message — I'll reply within 24 hours.</p>
          </div>
        </div>

        {/* Body */}
        {status === 'sent' ? (
          <div className="modal-success animate-fade-up">
            <div className="success-ring-large">
              <CheckCircle size={40} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Message sent! 🎉
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Thanks for reaching out! Check your inbox — an auto-reply is on its way.
            </p>
          </div>
        ) : (
          <form className="modal-form animate-fade-up" onSubmit={handleSubmit} noValidate>

            {/* Error banner */}
            {status === 'error' && (
              <div className="form-error-banner">
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Subject */}
            <div className="form-group">
              <label htmlFor="m-subject">Subject</label>
              <div className="select-wrapper">
                <select
                  id="m-subject" value={subject}
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
              <label htmlFor="m-name">Name <span className="required-star">*</span></label>
              <input
                type="text" id="m-name" ref={nameRef}
                required placeholder="John Doe"
                disabled={status === 'sending'}
              />
            </div>

            {/* Email + Phone */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="m-email" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Email <span className="required-star">*</span>
                  {emailValid === true  && <CheckCircle size={11} className="field-valid"   />}
                  {emailValid === false && <AlertCircle size={11} className="field-invalid" />}
                </label>
                <input
                  type="email" id="m-email" ref={emailRef}
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
                <label htmlFor="m-phone">Phone <span className="optional-label">(opt.)</span></label>
                <input
                  type="tel" id="m-phone" ref={phoneRef}
                  placeholder="+1 234 567 890"
                  disabled={status === 'sending'}
                />
              </div>
            </div>

            {/* Message */}
            <div className="form-group">
              <label htmlFor="m-message" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Message <span className="required-star">*</span></span>
                <span
                  className="char-counter"
                  style={{ color: msgLen > MAX_CHARS * 0.9 ? 'var(--brand-3)' : 'var(--text-muted)' }}
                >
                  {msgLen}/{MAX_CHARS}
                </span>
              </label>
              <textarea
                id="m-message" ref={msgRef}
                required rows={4}
                placeholder="Tell me about your project or idea…"
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
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={status === 'sending'}
            >
              {status === 'sending' ? (
                <><span className="sending-spinner" aria-hidden /> Sending securely…</>
              ) : (
                <><Send size={15} aria-hidden /> Send Message</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
