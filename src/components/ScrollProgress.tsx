import { useEffect, useState } from 'react'

export function ScrollProgress() {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const update = () => {
      const scrollTop    = window.scrollY
      const docHeight    = document.documentElement.scrollHeight - window.innerHeight
      const progress     = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setWidth(progress)
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div
      className="scroll-progress"
      style={{ width: `${width}%` }}
      aria-hidden
    />
  )
}
