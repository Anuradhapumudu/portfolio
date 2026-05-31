import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

export type ThemeKey = 'aurora' | 'sunset' | 'matrix' | 'rose'
export type ModeKey  = 'dark' | 'light'

type Theme = {
  key:    ThemeKey
  label:  string
  brand:  string
  brand2: string
  brand3: string
  swatch: string
}

export const THEMES: Theme[] = [
  {
    key:    'aurora',
    label:  'Aurora',
    brand:  '#a78bfa',
    brand2: '#22d3ee',
    brand3: '#ec4899',
    swatch: 'linear-gradient(135deg, #a78bfa, #22d3ee, #ec4899)',
  },
  {
    key:    'sunset',
    label:  'Sunset',
    brand:  '#fb923c',
    brand2: '#ef4444',
    brand3: '#f472b6',
    swatch: 'linear-gradient(135deg, #fb923c, #ef4444, #f472b6)',
  },
  {
    key:    'matrix',
    label:  'Matrix',
    brand:  '#22c55e',
    brand2: '#14b8a6',
    brand3: '#a3e635',
    swatch: 'linear-gradient(135deg, #22c55e, #14b8a6, #a3e635)',
  },
  {
    key:    'rose',
    label:  'Rose',
    brand:  '#f43f5e',
    brand2: '#d946ef',
    brand3: '#fda4af',
    swatch: 'linear-gradient(135deg, #f43f5e, #d946ef, #fda4af)',
  },
]

type Ctx = {
  theme:       Theme
  setThemeKey: (k: ThemeKey) => void
  mode:        ModeKey
  toggleMode:  () => void
}

const ThemeCtx = createContext<Ctx | null>(null)

const STORAGE_THEME = 'portfolio-theme'
const STORAGE_MODE  = 'portfolio-mode'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [key,  setKey]  = useState<ThemeKey>('aurora')
  const [mode, setMode] = useState<ModeKey>('dark')

  /* ── Initialise: read saved prefs or detect OS preference ── */
  useEffect(() => {
    // Colour theme
    const savedTheme = localStorage.getItem(STORAGE_THEME) as ThemeKey | null
    if (savedTheme && THEMES.find(t => t.key === savedTheme)) setKey(savedTheme)

    // Dark / light mode
    const savedMode = localStorage.getItem(STORAGE_MODE) as ModeKey | null
    if (savedMode === 'dark' || savedMode === 'light') {
      setMode(savedMode)
    } else {
      // Fall back to OS preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setMode(prefersDark ? 'dark' : 'light')
    }

    // Listen for OS preference changes (only when no saved override)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_MODE)) {
        setMode(e.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [])

  /* ── Apply colour theme CSS variables ── */
  useEffect(() => {
    const t    = THEMES.find(t => t.key === key) ?? THEMES[0]
    const root = document.documentElement
    root.style.setProperty('--brand',       t.brand)
    root.style.setProperty('--brand-2',     t.brand2)
    root.style.setProperty('--brand-3',     t.brand3)
    root.style.setProperty('--grad-brand',   `linear-gradient(135deg, ${t.brand} 0%, ${t.brand2} 100%)`)
    root.style.setProperty('--grad-brand-2', `linear-gradient(135deg, ${t.brand3} 0%, ${t.brand} 100%)`)
    try { localStorage.setItem(STORAGE_THEME, key) } catch { /* noop */ }
  }, [key])

  /* ── Apply dark / light data attribute ── */
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode)
    try { localStorage.setItem(STORAGE_MODE, mode) } catch { /* noop */ }
  }, [mode])

  const toggleMode = useCallback(() => setMode(m => m === 'dark' ? 'light' : 'dark'), [])

  const theme = THEMES.find(t => t.key === key) ?? THEMES[0]
  return (
    <ThemeCtx.Provider value={{ theme, setThemeKey: setKey, mode, toggleMode }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme outside provider')
  return ctx
}
