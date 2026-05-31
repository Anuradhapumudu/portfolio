import { CursorGlow }    from './components/CursorGlow'
import { ScrollProgress } from './components/ScrollProgress'
import { Nav }            from './components/Nav'
import { Hero }           from './components/Hero'
import { GitHubStats }    from './components/GitHubStats'
import { About }          from './components/About'
import { Projects }       from './components/Projects'
import { Stack }          from './components/Stack'
import { Timeline }       from './components/Timeline'
import { Contact }        from './components/Contact'
import { ContactModal }   from './components/ContactModal'
import { ThemeProvider }  from './theme'
import { useState }       from 'react'

export default function App() {
  const [isContactOpen, setIsContactOpen] = useState(false)

  return (
    <ThemeProvider>
      {/* Ambient effects */}
      <CursorGlow />
      <ScrollProgress />

      {/* Navigation */}
      <Nav onOpenContact={() => setIsContactOpen(true)} />

      {/* Main content */}
      <main id="main-content">
        <Hero onOpenContact={() => setIsContactOpen(true)} />
        <GitHubStats />
        <About onOpenContact={() => setIsContactOpen(true)} />
        <Projects />
        <Stack />
        <Timeline />
        <Contact onOpenContact={() => setIsContactOpen(true)} />
      </main>

      {/* Modal */}
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </ThemeProvider>
  )
}
