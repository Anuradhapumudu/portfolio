import { useEffect, useRef } from 'react'

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const move = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`
      el.style.top  = `${e.clientY}px`
    }
    const show = () => { el.style.opacity = '1' }
    const hide = () => { el.style.opacity = '0' }
    window.addEventListener('mousemove', move)
    document.addEventListener('mouseenter', show)
    document.addEventListener('mouseleave', hide)
    return () => {
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseenter', show)
      document.removeEventListener('mouseleave', hide)
    }
  }, [])

  return <div ref={ref} className="cursor-glow" aria-hidden />
}
