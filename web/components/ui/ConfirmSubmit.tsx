'use client'
import * as React from 'react'

export default function ConfirmSubmit({
  label,
  disabled,
  title = 'Buchung bestätigen',
  description = 'Bist du sicher? Diese Aktion schreibt die Buchung auf dein Konto.',
}: {
  label: string
  disabled?: boolean
  title?: string
  description?: string
}) {
  const [open, setOpen] = React.useState(false)

  // Hilfsfunktion: nächstliegendes <form> finden und submitten
  const submitClosestForm = (btn: HTMLButtonElement | null) => {
    if (!btn) return
    const form = btn.closest('form') as HTMLFormElement | null
    if (form) form.requestSubmit()
  }

  // Escape schließt Modal
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div>
      <button
        type="button"
        className="btn btn-primary w-full"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        Verbuchen
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />

          {/* Dialog */}
          <div className="relative w-[92%] max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
            <div className="text-lg font-semibold">{title}</div>
            <div className="text-sm text-zinc-400 mt-1">{description}</div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setOpen(false)}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={(ev) => {
                  submitClosestForm(ev.currentTarget as HTMLButtonElement)
                  setOpen(false)
                }}
              >
                {label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
