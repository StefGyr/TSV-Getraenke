'use client'
import React from 'react'

export default function AutoLogout({ seconds = 90 }: { seconds?: number }) {
  const [left, setLeft] = React.useState(seconds)

  React.useEffect(() => {
    let t: any
    let last = Date.now()
    const tick = () => {
      const now = Date.now()
      const diff = Math.round((now - last) / 1000)
      last = now
      setLeft((s) => (s - diff <= 0 ? 0 : s - diff))
      t = setTimeout(tick, 1000)
    }
    t = setTimeout(tick, 1000)

    const reset = () => setLeft(seconds)
    window.addEventListener('mousemove', reset)
    window.addEventListener('keydown', reset)
    window.addEventListener('touchstart', reset)

    return () => {
      clearTimeout(t)
      window.removeEventListener('mousemove', reset)
      window.removeEventListener('keydown', reset)
      window.removeEventListener('touchstart', reset)
    }
  }, [seconds])

  React.useEffect(() => {
    if (left === 0) {
      // leise abmelden
      fetch('/terminal/logout', { method: 'POST' }).finally(() => {
        window.location.href = '/terminal?msg=auto-logout'
      })
    }
  }, [left])

  return (
    <div className="text-[10px] text-zinc-500 text-right">
      Auto-Logout in {left}s
    </div>
  )
}
