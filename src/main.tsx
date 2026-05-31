import React from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import App from './App.tsx'
import './index.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'dummy_key'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      <App />
    </GoogleReCaptchaProvider>
  </React.StrictMode>,
)
