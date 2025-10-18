'use client'

import React from 'react'
import Modal from '@/components/Modal'
import { useRouter } from 'next/navigation'

type Props = {
  drinkId: string
  drinkName: string
  priceText: string
  hasAnyCrate: boolean
}

export default function BookCard({ drinkId, drinkName, priceText, hasAnyCrate }: Props) {
  const [qty, setQty] = React.useState<number>(1)
  const [open, setOpen] = React.useState<null | 'single' | 'crate'>(null)
  const [loading, setLoading] = React.useState(false)
  const [msg, setMsg] = React.useState<string | null>(null)
  const router = useRouter()

  const doPost = async (url: string, body: any) => {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Fehler')
      setMsg('✓ Verbuchung gespeichert')
      router.refresh()
    } catch (e: any) {
      setMsg(`⚠️ ${e.message || 'Fehler'}`)
    } finally {
      setLoading(false)
      setOpen(null)
    }
  }

  const confirmLines = (isCrate: boolean) => [
    `Getränk: ${drinkName}`,
    `Menge: ${qty}×`,
    `Preis: ${isCrate ? 'kostenlos (Freibier)' : priceText}`,
  ]

  return (
    <div className="flex flex-col gap-2 min-w-[260px]">
      <div className="flex gap-2">
        <input
          value={qty}
          onChange={e => setQty(Math.max(1, parseInt(e.target.value || '1', 10) || 1))}
          inputMode="numeric"
          className="input"
          style={{ width: 80 }}
          aria-label="Menge"
        />
        <button className="btn btn-primary" type="button" onClick={() => setOpen('single')}>
          Verbuchen
        </button>
      </div>
      <button
        className="btn btn-ghost"
        type="button"
        disabled={!hasAnyCrate}
        onClick={() => setOpen('crate')}
        title={hasAnyCrate ? 'Kostenlos aus Kiste' : 'Keine aktive Kiste mit Rest'}
      >
        Aus Kiste
      </button>

      {/* Status-Msg */}
      {msg && <div className="text-xs text-zinc-300">{msg}</div>}

      {/* Modal */}
      <Modal
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open === 'crate' ? 'Kostenlos aus Kiste verbuchen' : 'Getränk verbuchen'}
        footer={
          <>
            <button className="btn btn-ghost" type="button" onClick={() => setOpen(null)} disabled={loading}>
              Abbrechen
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={loading}
              onClick={() =>
                doPost(
                  open === 'crate' ? '/api/verbuchen/crate-book' : '/api/verbuchen/book',
                  { drinkId, qty }
                )
              }
            >
              {loading ? 'Bitte warten…' : 'Bestätigen'}
            </button>
          </>
        }
      >
        <div className="space-y-2">
          {confirmLines(open === 'crate').map((t, i) => (
            <div key={i} className="text-sm leading-relaxed">{t}</div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
