'use client'

import React from 'react'
import Modal from './Modal'

type Props = {
  label: string
  confirmTitle?: string
  lines?: string[]
  okLabel?: string
  className?: string
  disabled?: boolean
  drinkName?: string
  priceText?: string
}

export default function ConfirmModalSubmit({
  label,
  confirmTitle = 'Bitte bestätigen',
  lines,
  okLabel = 'Bestätigen',
  className,
  disabled,
  drinkName,
  priceText,
}: Props) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)

  const openModal = () => { if (!disabled) setOpen(true) }

  const submitForm = () => {
    setOpen(false)
    const form = triggerRef.current?.closest('form') as HTMLFormElement | null
    if (!form) return
    const submitter = form.querySelector<HTMLButtonElement>('button[data-sa-submit="true"]')
    // Wichtig: requestSubmit(submitter) – so „weiß“ der Browser, welche Action gemeint ist.
    if (form.requestSubmit) {
      form.requestSubmit(submitter || undefined)
    } else {
      // Fallback
      submitter?.click() || form.submit()
    }
  }

  const computedLines = React.useMemo(() => {
    if (lines?.length) return lines
    const form = triggerRef.current?.closest('form') as HTMLFormElement | null
    const qty = form?.querySelector<HTMLInputElement>('input[name="qty"]')?.value
    const out: string[] = []
    if (drinkName) out.push(`Getränk: ${drinkName}`)
    if (qty) out.push(`Menge: ${qty}×`)
    if (priceText) out.push(`Preis: ${priceText}`)
    return out
  }, [open, lines, drinkName, priceText])

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={className}
        disabled={disabled}
        onClick={openModal}
      >
        {label}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={confirmTitle}
        footer={
          <>
            <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>
              Abbrechen
            </button>
            <button className="btn btn-primary" type="button" onClick={submitForm}>
              {okLabel}
            </button>
          </>
        }
      >
        <div className="space-y-2">
          {computedLines.map((t, i) => (
            <div key={i} className="text-sm leading-relaxed">{t}</div>
          ))}
        </div>
      </Modal>
    </>
  )
}
