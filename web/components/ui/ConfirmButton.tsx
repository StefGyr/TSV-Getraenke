// web/components/ui/ConfirmButton.tsx
'use client'

import * as React from 'react'

type Props = {
  label: string
  disabled?: boolean
  /** Überschrift im Modal */
  title?: string
  /** Beschreibung im Modal */
  description?: string
  /** Zusätzliche Button-Klassen */
  className?: string
}

export default function ConfirmButton({
  label,
  disabled,
  title = 'Buchung bestätigen?',
  description = 'Bitte bestätigen, um fortzufahren.',
  className = '',
}: Props) {
  const [open, setOpen] = React.useState(false)
  const btnRef = React.useRef<HTMLButtonElement | null>(null)

  // Öffnet das Modal (verhindert direkten Submit)
  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (disabled) return
    setOpen(true)
  }

  // Backdrop-Klick: Modal schließen
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setOpen(false)
  }

  // Abbrechen-Button
  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setOpen(false)
  }

  // Bestätigen-Button -> umgebendes <form> submitten
  const handleConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const form = btnRef.current?.closest('form') as HTMLFormElement | null
    if (form) {
      setOpen(false)
      // requestSubmit, wenn verfügbar, sonst fallback auf submit()
      if (typeof (form as any).requestSubmit === 'function') {
        ;(form as any).requestSubmit()
      } else {
        form.submit()
      }
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`btn btn-primary ${className}`}
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
          role="dialog"
          aria-modal="true"
          onClick={handleBackdropClick}
        >
          <div
            className="w-[90vw] max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()} // Klicks im Dialog nicht zum Backdrop „durchreichen“
          >
            <div className="text-lg font-semibold">{title}</div>
            <div className="mt-1 text-sm text-zinc-300">{description}</div>

            <div className="mt-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-ghost"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="btn btn-primary"
              >
                Bestätigen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
