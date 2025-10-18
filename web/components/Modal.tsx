'use client'

import React from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
  footer?: React.ReactNode
}

export default function Modal({ open, onClose, title, children, footer }: Props) {
  const [mounted, setMounted] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => { setMounted(true) }, [])

  // ESC schließt + Scroll sperren
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  // Fokus auf Panel setzen
  React.useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  if (!mounted || !open) return null

  const node = (
    <div
      aria-modal
      role="dialog"
      className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
        aria-hidden
      />
      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-[100000] w-[min(92vw,520px)] max-w-[92vw] pointer-events-auto
                   rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
      >
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        <div className="text-zinc-200">{children}</div>
        {footer && <div className="mt-4 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
