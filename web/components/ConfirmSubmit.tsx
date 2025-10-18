'use client'

type Props = {
  children: React.ReactNode
  confirmText: string
  className?: string
  disabled?: boolean
}

/**
 * Button, der beim Klicken eine confirm()-Abfrage zeigt.
 * Verhindert das Submit, wenn abgebrochen wird.
 */
export default function ConfirmSubmit({ children, confirmText, className, disabled }: Props) {
  return (
    <button
      type="submit"
      className={className}
      disabled={disabled}
      onClick={(e) => {
        if (disabled) return
        // Browser-Confirm
        // (später gern durch ein schönes Modal ersetzen)
        const ok = window.confirm(confirmText)
        if (!ok) e.preventDefault()
      }}
    >
      {children}
    </button>
  )
}
