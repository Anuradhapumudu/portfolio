// ═══════════════════════════════════════════════════════════════
// Cloudflare Worker — Portfolio Contact Form  (Enhanced v2)
// ─────────────────────────────────────────────────────────────
//  ✦ reCAPTCHA v3 verification
//  ✦ KV-based IP rate limiting  (3 requests / IP / hour)
//  ✦ Server-side spam keyword filter
//  ✦ Subject / category field
//  ✦ Auto-reply to sender via Resend
//  ✦ Rich HTML email notification (you)
//  ✦ Telegram notification (you)
//  ✦ HTML input sanitisation
//  ✦ Structured error codes for the frontend
// ═══════════════════════════════════════════════════════════════

export default {
  async fetch(request, env) {

    // ── CORS Pre-flight ──────────────────────────────────────────
    const ALLOWED_ORIGINS = [
      'https://pumudu.lovable.app',
      'https://pumudu.online',
      'https://anuradhapumudu.github.io',
      'http://localhost:5173',   // Vite dev
      'http://localhost:4173',   // Vite preview
    ]
    const origin      = request.headers.get('Origin') || ''
    const corsOrigin  = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
    const corsHeaders = {
      'Access-Control-Allow-Origin':  corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return jsonRes({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405, corsHeaders)
    }

    try {
      // ════════════════════════════════════════════════════════
      // ENVIRONMENT SECRETS  (set in Cloudflare dashboard)
      // ════════════════════════════════════════════════════════
      const RESEND_API_KEY     = env.RESEND_API_KEY
      const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN
      const TELEGRAM_CHAT_ID   = env.TELEGRAM_CHAT_ID   || '-4870773780'
      const YOUR_EMAIL         = env.YOUR_EMAIL          || 'pumudu820@gmail.com'
      const FROM_EMAIL         = env.FROM_EMAIL          || 'contact@pumudu.online'
      const RECAPTCHA_SECRET   = env.RECAPTCHA_SECRET
      // env.CONTACT_KV  — KV namespace (bind as "CONTACT_KV" in dashboard)

      if (!RESEND_API_KEY || !TELEGRAM_BOT_TOKEN || !RECAPTCHA_SECRET) {
        console.error('Missing required environment variables.')
        return jsonRes({ error: 'Server configuration error.', code: 'CONFIG_ERROR' }, 500, corsHeaders)
      }

      // ── Parse body ───────────────────────────────────────────
      const body = await request.json().catch(() => ({}))
      const { name, email, phone, message, subject, token } = body

      // ── Input validation ─────────────────────────────────────
      if (!name || !email || !message) {
        return jsonRes({ error: 'Name, email, and message are required.', code: 'VALIDATION_ERROR' }, 400, corsHeaders)
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonRes({ error: 'Please provide a valid email address.', code: 'INVALID_EMAIL' }, 400, corsHeaders)
      }
      if (!token) {
        return jsonRes({ error: 'Security token missing. Please refresh and try again.', code: 'TOKEN_MISSING' }, 400, corsHeaders)
      }
      if (message.length > 1000) {
        return jsonRes({ error: 'Message must be 1000 characters or fewer.', code: 'MESSAGE_TOO_LONG' }, 400, corsHeaders)
      }

      // ── Sanitise all user inputs ─────────────────────────────
      const safe = {
        name:    sanitize(String(name).slice(0, 120)),
        email:   sanitize(String(email).slice(0, 254)),
        phone:   sanitize(String(phone || '').slice(0, 30)),
        message: sanitize(String(message).slice(0, 1000)),
        subject: sanitize(String(subject || 'general').slice(0, 40)),
      }

      // ── Server-side spam filter ──────────────────────────────
      const spamCheck = detectSpam(safe.name, safe.message)
      if (spamCheck.isSpam) {
        console.warn(`Spam blocked [${spamCheck.reason}] from ${request.headers.get('CF-Connecting-IP')}`)
        // Soft-reject: tell client it was "sent" to avoid spam enumeration
        return jsonRes({ success: true, email: false, telegram: false }, 200, corsHeaders)
      }

      // ── IP Rate limiting (KV) ────────────────────────────────
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
      if (env.CONTACT_KV) {
        const rl = await checkRateLimit(env.CONTACT_KV, clientIP)
        if (rl.limited) {
          return jsonRes({
            error: `Too many messages. You can send up to 3 messages per hour. Please try again in ${rl.retryAfterMinutes} minute(s).`,
            code:  'RATE_LIMITED',
          }, 429, { ...corsHeaders, 'Retry-After': String(rl.retryAfterSeconds) })
        }
      }

      // ── Verify reCAPTCHA v3 ──────────────────────────────────
      const captchaResp   = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams({ secret: RECAPTCHA_SECRET, response: token, remoteip: clientIP }),
      })
      const captchaResult = await captchaResp.json()

      if (!captchaResult.success || captchaResult.score < 0.3) {
        return jsonRes({
          error:   'Security verification failed. Please refresh and try again.',
          code:    'CAPTCHA_FAILED',
          details: captchaResult['error-codes'],
        }, 403, corsHeaders)
      }

      // ── Collect Cloudflare visitor metadata ──────────────────
      const cf = request.cf || {}
      const visitor = {
        ip:             clientIP,
        country:        cf.country        || 'Unknown',
        countryName:    getCountryName(cf.country),
        city:           cf.city           || 'Unknown',
        region:         cf.region         || 'Unknown',
        timezone:       cf.timezone       || 'Unknown',
        postalCode:     cf.postalCode     || '—',
        latitude:       cf.latitude       || '—',
        longitude:      cf.longitude      || '—',
        colo:           cf.colo           || 'Unknown',
        asn:            cf.asn            || 'Unknown',
        organization:   cf.asOrganization || 'Unknown',
        httpProtocol:   cf.httpProtocol   || 'Unknown',
        tlsVersion:     cf.tlsVersion     || 'Unknown',
        userAgent:      request.headers.get('User-Agent')        || 'Unknown',
        referer:        request.headers.get('Referer')           || 'Direct',
        acceptLang:     request.headers.get('Accept-Language')   || 'Unknown',
        timestamp:      new Date().toISOString(),
        recaptchaScore: captchaResult.score || 0,
      }

      // ── Send all notifications in parallel ───────────────────
      const subjectLabel = getSubjectLabel(safe.subject)

      const [emailResult, telegramResult, autoReplyResult] = await Promise.allSettled([
        // 1. Notification email → you
        fetch('https://api.resend.com/emails', {
          method:  'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            from:      `Pumudu Anuradha <${FROM_EMAIL}>`,
            to:        YOUR_EMAIL,
            reply_to:  safe.email,
            subject:   `📬 [${subjectLabel}] New message from ${safe.name}`,
            html:      generateEmailHTML(safe.name, safe.email, safe.phone, safe.message, safe.subject, subjectLabel, visitor),
          }),
        }),

        // 2. Telegram notification → you
        fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            chat_id:    TELEGRAM_CHAT_ID,
            text:       generateTelegram(safe.name, safe.email, safe.phone, safe.message, safe.subject, subjectLabel, visitor),
            parse_mode: 'HTML',
          }),
        }),

        // 3. Auto-reply → sender
        fetch('https://api.resend.com/emails', {
          method:  'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            from:    `Pumudu Anuradha <${FROM_EMAIL}>`,
            to:      safe.email,
            subject: `👋 Got your message, ${safe.name.split(' ')[0]}!`,
            html:    generateAutoReplyHTML(safe.name, safe.message, subjectLabel),
          }),
        }),
      ])

      // ── Log any failures ─────────────────────────────────────
      for (const [label, result] of [
        ['Email', emailResult], ['Telegram', telegramResult], ['AutoReply', autoReplyResult]
      ] as const) {
        if (result.status === 'fulfilled' && !result.value.ok) {
          const txt = await result.value.text().catch(() => '')
          console.error(`${label} error ${result.value.status}:`, txt)
        } else if (result.status === 'rejected') {
          console.error(`${label} rejected:`, result.reason)
        }
      }

      const emailOk     = emailResult.status     === 'fulfilled' && emailResult.value.ok
      const telegramOk  = telegramResult.status  === 'fulfilled' && telegramResult.value.ok
      const autoReplyOk = autoReplyResult.status === 'fulfilled' && autoReplyResult.value.ok

      if (emailOk || telegramOk) {
        return jsonRes({ success: true, email: emailOk, telegram: telegramOk, autoReply: autoReplyOk }, 200, corsHeaders)
      }
      throw new Error('All delivery channels failed')

    } catch (error) {
      console.error('Worker error:', error.message, error.stack)
      return jsonRes({ error: 'Failed to send message. Please try again later.', code: 'INTERNAL_ERROR' }, 500, corsHeaders)
    }
  },
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function jsonRes(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  })
}

// ── HTML sanitiser ───────────────────────────────────────────────
function sanitize(str) {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;')
}

// ── Rate limiter (KV) ────────────────────────────────────────────
// Uses Cloudflare KV for sliding-window rate limiting:
//   key = "rl:<IP>", value = JSON {count, windowStart}
//   max 3 requests per hour (3600 seconds)
async function checkRateLimit(kv, ip, limit = 3, windowSecs = 3600) {
  const key   = `rl:${ip}`
  const now   = Date.now()
  const raw   = await kv.get(key)
  let entry   = raw ? JSON.parse(raw) : { count: 0, windowStart: now }

  // Reset if window has expired
  if (now - entry.windowStart > windowSecs * 1000) {
    entry = { count: 0, windowStart: now }
  }

  if (entry.count >= limit) {
    const elapsed       = now - entry.windowStart
    const retryAfterMs  = windowSecs * 1000 - elapsed
    const retryAfterSec = Math.ceil(retryAfterMs / 1000)
    return {
      limited:            true,
      retryAfterSeconds:  retryAfterSec,
      retryAfterMinutes:  Math.ceil(retryAfterSec / 60),
    }
  }

  entry.count++
  const ttl = Math.ceil((windowSecs * 1000 - (now - entry.windowStart)) / 1000)
  await kv.put(key, JSON.stringify(entry), { expirationTtl: ttl })
  return { limited: false }
}

// ── Spam keyword filter ──────────────────────────────────────────
const SPAM_KEYWORDS = [
  'casino', 'viagra', 'cheap meds', 'bitcoin investment', 'make money fast',
  'click here', 'free money', 'guaranteed profit', 'loan offer', 'earn from home',
  'seo services', 'buy links', 'adult content', '18+', 'onlyfans',
  'drop shipping', 'mlm opportunity', 'pyramid scheme', 'crypto pump',
]

function detectSpam(name, message) {
  const combined = `${name} ${message}`.toLowerCase()
  for (const kw of SPAM_KEYWORDS) {
    if (combined.includes(kw)) {
      return { isSpam: true, reason: kw }
    }
  }
  // Heuristic: excessive URLs
  const urlCount = (combined.match(/https?:\/\//g) || []).length
  if (urlCount > 3) return { isSpam: true, reason: 'excessive_urls' }

  // All-caps message (likely spam)
  const words = message.trim().split(/\s+/)
  if (words.length > 5 && words.filter(w => w === w.toUpperCase() && /[A-Z]/.test(w)).length / words.length > 0.6) {
    return { isSpam: true, reason: 'all_caps' }
  }

  return { isSpam: false, reason: null }
}

// ── Subject label ────────────────────────────────────────────────
function getSubjectLabel(subject) {
  const map = {
    general:       '💬 General Inquiry',
    job:           '💼 Job Opportunity',
    collaboration: '🤝 Collaboration',
    freelance:     '🚀 Freelance Project',
    other:         '📌 Other',
  }
  return map[subject] || '💬 General Inquiry'
}

// ── Country code → name ──────────────────────────────────────────
function getCountryName(code) {
  if (!code) return 'Unknown'
  const c = {
    LK:'Sri Lanka', US:'United States', GB:'United Kingdom', IN:'India',
    AU:'Australia', CA:'Canada', DE:'Germany', FR:'France', JP:'Japan',
    SG:'Singapore', AE:'UAE', NL:'Netherlands', SE:'Sweden', KR:'South Korea',
    BR:'Brazil', IT:'Italy', ES:'Spain', PK:'Pakistan', BD:'Bangladesh',
    MY:'Malaysia', NG:'Nigeria', ZA:'South Africa', EG:'Egypt', MX:'Mexico',
  }
  return c[code] || code
}

// ═══════════════════════════════════════════════════════════════
// TELEGRAM MESSAGE
// ═══════════════════════════════════════════════════════════════
function generateTelegram(name, email, phone, message, subject, subjectLabel, v) {
  const mapsUrl = (v.latitude !== '—' && v.longitude !== '—')
    ? `https://maps.google.com/?q=${v.latitude},${v.longitude}`
    : null

  return `
📬 <b>New Portfolio Message</b>

<b>📂 Category</b>
└ ${subjectLabel}

<b>👤 Sender</b>
├ Name: ${name}
├ Email: ${email}
└ Phone: ${phone || '—'}

<b>💬 Message</b>
${message}

<b>🌍 Location</b>
├ ${v.city}, ${v.region}
├ ${v.countryName} (${v.country})
├ Timezone: ${v.timezone}
├ Postal: ${v.postalCode}
${mapsUrl ? `└ <a href="${mapsUrl}">📍 View on Maps</a>` : `└ Coords: ${v.latitude}, ${v.longitude}`}

<b>📡 Network</b>
├ IP: <code>${v.ip}</code>
├ ISP: ${v.organization}
├ ASN: ${v.asn}
├ Colo: ${v.colo}
└ Protocol: ${v.httpProtocol} / ${v.tlsVersion}

<b>🖥️ Client</b>
├ UA: ${v.userAgent.substring(0, 120)}
├ Language: ${v.acceptLang.substring(0, 40)}
└ Referer: ${v.referer}

<b>🛡️ Security</b>
└ reCAPTCHA Score: ${v.recaptchaScore}/1.0

📅 ${v.timestamp}
  `.trim()
}

// ═══════════════════════════════════════════════════════════════
// AUTO-REPLY EMAIL HTML  (sent to the person who contacted you)
// ═══════════════════════════════════════════════════════════════
function generateAutoReplyHTML(name, message, subjectLabel) {
  const firstName = name.split(' ')[0]
  const preview   = message.length > 120 ? message.slice(0, 120) + '…' : message

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Got your message!</title>
</head>
<body style="margin:0;padding:0;background:#050510;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050510;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;">

        <!-- Avatar -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <img src="https://avatars.githubusercontent.com/u/106007410?v=4" width="64" height="64"
              alt="Pumudu Anuradha" style="border-radius:50%;border:3px solid rgba(167,139,250,0.3);display:block;" />
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c0c1d;border:1px solid rgba(167,139,250,0.12);border-radius:20px;overflow:hidden;">

              <!-- Gradient bar -->
              <tr><td style="height:4px;background:linear-gradient(90deg,#a78bfa,#22d3ee,#ec4899);"></td></tr>

              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <p style="margin:0 0 8px;color:#a78bfa;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Auto-reply</p>
                  <h1 style="margin:0 0 20px;color:#f0f0f8;font-size:26px;font-weight:800;line-height:1.2;">
                    Hey ${firstName}, got your message! 👋
                  </h1>
                  <p style="margin:0 0 24px;color:#8888a8;font-size:15px;line-height:1.7;">
                    Thanks for reaching out. I've received your message and I'll get back to you <strong style="color:#f0f0f8;">within 24 hours</strong>.
                  </p>

                  <!-- Message echo -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(167,139,250,0.04);border:1px solid rgba(167,139,250,0.12);border-left:3px solid #a78bfa;border-radius:14px;margin-bottom:28px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 8px;color:#6a6a85;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Your message · ${subjectLabel}</p>
                        <p style="margin:0;color:#c8c8d8;font-size:14px;line-height:1.7;white-space:pre-wrap;">${preview}</p>
                      </td>
                    </tr>
                  </table>

                  <!-- What's next -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:14px;margin-bottom:32px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 12px;color:#6a6a85;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">What happens next?</p>
                        <p style="margin:0 0 8px;color:#c8c8d8;font-size:14px;line-height:1.6;">✦ I'll review your message and reply personally</p>
                        <p style="margin:0 0 8px;color:#c8c8d8;font-size:14px;line-height:1.6;">✦ Response time is usually under 24 hours</p>
                        <p style="margin:0;color:#c8c8d8;font-size:14px;line-height:1.6;">✦ Check your spam folder just in case</p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA -->
                  <p style="margin:0;color:#8888a8;font-size:13px;line-height:1.7;">
                    While you wait, feel free to check out my work on
                    <a href="https://github.com/Anuradhapumudu" style="color:#a78bfa;text-decoration:none;">GitHub</a>
                    or visit <a href="https://pumudu.lovable.app/" style="color:#22d3ee;text-decoration:none;">pumudu.lovable.app</a>.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:20px 0;">
            <p style="margin:0;color:#3a3a50;font-size:11px;">
              This is an automated reply from
              <a href="https://pumudu.lovable.app/" style="color:#a78bfa;text-decoration:none;">pumudu.lovable.app</a>
              — please do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION EMAIL HTML  (sent to you)
// ═══════════════════════════════════════════════════════════════
function generateEmailHTML(name, email, phone, message, subject, subjectLabel, v) {
  const d         = new Date(v.timestamp)
  const dateStr   = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr   = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' })
  const initial   = name.charAt(0).toUpperCase()
  const scoreColor = v.recaptchaScore >= 0.7 ? '#00d4aa' : v.recaptchaScore >= 0.4 ? '#ffd166' : '#ff6b9d'
  const scoreLabel = v.recaptchaScore >= 0.7 ? 'Human'   : v.recaptchaScore >= 0.4 ? 'Suspicious' : 'Bot-like'
  const mapsUrl    = (v.latitude !== '—' && v.longitude !== '—')
    ? `https://maps.google.com/?q=${v.latitude},${v.longitude}`
    : null

  // Subject badge colour
  const subjectColors = {
    general:       '#6c63ff',
    job:           '#00d4aa',
    collaboration: '#ffd166',
    freelance:     '#ff6b9d',
    other:         '#a78bfa',
  }
  const subjectColor = subjectColors[subject] || '#6c63ff'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New message from ${name}</title>
</head>
<body style="margin:0;padding:0;background:#050510;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;-webkit-font-smoothing:antialiased;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050510;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <img src="https://avatars.githubusercontent.com/u/106007410?v=4" width="52" height="52"
              alt="Pumudu" style="border-radius:16px;display:block;" />
          </td>
        </tr>

        <!-- Main Card -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c0c1d;border:1px solid rgba(108,99,255,0.12);border-radius:20px;overflow:hidden;">

              <!-- Gradient Bar -->
              <tr><td style="height:3px;background:linear-gradient(90deg,#6c63ff,#00d4aa,#ff6b9d);"></td></tr>

              <!-- Header row -->
              <tr>
                <td style="padding:32px 40px 0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <!-- Subject badge -->
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background:${subjectColor}18;border:1px solid ${subjectColor}40;border-radius:20px;padding:5px 14px;">
                              <span style="color:${subjectColor};font-size:11px;font-weight:700;letter-spacing:0.5px;">${subjectLabel}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td align="right" style="color:#4a4a65;font-size:12px;">${dateStr}</td>
                    </tr>
                  </table>
                  <p style="margin:12px 0 0;color:#4a4a65;font-size:12px;">Received at ${timeStr}</p>
                </td>
              </tr>

              <!-- Sender Card -->
              <tr>
                <td style="padding:24px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(108,99,255,0.04);border:1px solid rgba(108,99,255,0.12);border-radius:16px;">
                    <tr>
                      <td style="padding:22px 26px;">
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="width:54px;height:54px;background:linear-gradient(135deg,#6c63ff,#00d4aa);border-radius:50%;text-align:center;vertical-align:middle;">
                              <span style="color:#fff;font-size:22px;font-weight:700;line-height:54px;">${initial}</span>
                            </td>
                            <td style="padding-left:18px;vertical-align:middle;">
                              <p style="margin:0 0 3px;color:#f0f0f8;font-size:17px;font-weight:600;">${name}</p>
                              <a href="mailto:${email}" style="color:#6c63ff;text-decoration:none;font-size:13px;">${email}</a>
                              ${phone ? `<p style="margin:5px 0 0;color:#7a7a95;font-size:13px;">📱 ${phone}</p>` : ''}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Message -->
              <tr>
                <td style="padding:0 40px 28px;">
                  <p style="margin:0 0 12px;color:#4a4a65;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">MESSAGE</p>
                  <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-left:3px solid #6c63ff;border-radius:14px;padding:26px;">
                    <p style="margin:0;color:#e8e8f0;font-size:15px;line-height:1.85;white-space:pre-wrap;">${message}</p>
                  </div>
                </td>
              </tr>

              <!-- Reply Button -->
              <tr>
                <td style="padding:0 40px 32px;" align="center">
                  <a href="mailto:${email}?subject=Re: [${subjectLabel}] Your message on pumudu.online"
                     style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#00d4aa);color:#fff;text-decoration:none;padding:15px 44px;border-radius:14px;font-size:14px;font-weight:600;letter-spacing:0.2px;">
                    Reply to ${name} →
                  </a>
                </td>
              </tr>

              <!-- Divider -->
              <tr><td style="padding:0 40px;"><div style="height:1px;background:rgba(255,255,255,0.04);"></div></td></tr>

              <!-- Visitor Info Header -->
              <tr>
                <td style="padding:28px 40px 0;">
                  <p style="margin:0 0 16px;color:#4a4a65;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">VISITOR INFORMATION</p>
                </td>
              </tr>

              <!-- Location -->
              <tr>
                <td style="padding:0 40px 8px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(108,99,255,0.03);border:1px solid rgba(108,99,255,0.08);border-radius:12px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0 0 4px;color:#6c63ff;font-size:11px;font-weight:600;letter-spacing:0.5px;">📍 LOCATION</p>
                        <p style="margin:0;color:#c8c8d8;font-size:14px;font-weight:500;">${v.city}, ${v.region}</p>
                        <p style="margin:3px 0 0;color:#7a7a95;font-size:13px;">${v.countryName} (${v.country}) · ${v.timezone}</p>
                        <p style="margin:3px 0 0;color:#5a5a75;font-size:12px;">
                          Postal: ${v.postalCode} · Coords: ${v.latitude}, ${v.longitude}
                          ${mapsUrl ? ` · <a href="${mapsUrl}" style="color:#6c63ff;text-decoration:none;">View Map</a>` : ''}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Network -->
              <tr>
                <td style="padding:0 40px 8px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,212,170,0.03);border:1px solid rgba(0,212,170,0.08);border-radius:12px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0 0 4px;color:#00d4aa;font-size:11px;font-weight:600;letter-spacing:0.5px;">📡 NETWORK</p>
                        <p style="margin:0;color:#c8c8d8;font-size:14px;font-weight:500;font-family:monospace;">${v.ip}</p>
                        <p style="margin:3px 0 0;color:#7a7a95;font-size:13px;">${v.organization} (AS${v.asn})</p>
                        <p style="margin:3px 0 0;color:#5a5a75;font-size:12px;">Colo: ${v.colo} · ${v.httpProtocol} · ${v.tlsVersion}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Client -->
              <tr>
                <td style="padding:0 40px 8px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,107,157,0.03);border:1px solid rgba(255,107,157,0.08);border-radius:12px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0 0 4px;color:#ff6b9d;font-size:11px;font-weight:600;letter-spacing:0.5px;">🖥️ CLIENT</p>
                        <p style="margin:0;color:#7a7a95;font-size:12px;line-height:1.6;word-break:break-all;">${v.userAgent}</p>
                        <p style="margin:5px 0 0;color:#5a5a75;font-size:12px;">Language: ${v.acceptLang.substring(0, 60)}</p>
                        <p style="margin:3px 0 0;color:#5a5a75;font-size:12px;">Referer: ${v.referer}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Security -->
              <tr>
                <td style="padding:0 40px 28px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:12px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0 0 4px;color:#ffd166;font-size:11px;font-weight:600;letter-spacing:0.5px;">🛡️ SECURITY</p>
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-right:12px;">
                              <p style="margin:0;color:#c8c8d8;font-size:14px;font-weight:600;">reCAPTCHA: <span style="color:${scoreColor};">${v.recaptchaScore}/1.0</span></p>
                            </td>
                            <td>
                              <span style="background:${scoreColor};color:#050510;font-size:10px;font-weight:700;padding:3px 10px;border-radius:10px;letter-spacing:0.5px;">${scoreLabel}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:24px 0;">
            <p style="margin:0;color:#3a3a50;font-size:11px;">
              <a href="https://pumudu.lovable.app/" style="color:#6c63ff;text-decoration:none;">pumudu.lovable.app</a> · Contact form notification
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`
}
