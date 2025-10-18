'use client'

import * as React from 'react'

type Props = {
  formId: string
  priceCents?: number | null
  disabled?: boolean
}

function euro(n?: number | null) {
  if (!n && n !== 0) return '—'
  return (n / 100).toFixed(2).replace('.', ',') + ' €'
}

export default function ConfirmIssueCrate({ formId, priceCents, disabled }: Props) {
  const [open, setOpen] = React.useState(false)

  function onConfirm() {
    const form = document.getElementById(formId) as HTMLFormElement | null
    if (form) form.requestSubmit()
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-primary w-full"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Kiste ausgeben
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl">
            <div className="text-lg font-semibold">Kiste wirklich ausgeben?</div>
            <div className="mt-2 text-sm text-zinc-300">
              Diese Aktion <b>belastet dich</b> mit dem Kistenpreis und stellt die
              Kiste der Mannschaft als <i>Freibier</i> zur Verfügung.
            </div>
            <div className="mt-3 text-sm text-zinc-400">
              Kistenpreis: <b>{euro(priceCents)}</b>
            </div>

            <div className="mt-5 flex justify-end gap-2">
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
                onClick={onConfirm}
              >
                Ja, Kiste ausgeben
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
