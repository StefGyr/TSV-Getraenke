// web/components/admin/PaymentsTableClient.tsx
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

type Row = {
  id: number
  user_id: string
  user_name: string
  amount_cents: number
  tip_cents: number
  method: 'paypal' | 'cash'
  status: 'reported' | 'verified' | 'rejected'
  overpay_handling: 'tip' | 'credit' | null
  created_at: string
}

function euro(n: number) {
  return (n / 100).toFixed(2).replace('.', ',') + ' €'
}

export default function PaymentsTableClient({
  rows,
  emptyText = 'Keine Daten',
}: {
  rows: Row[]
  emptyText?: string
}) {
  const router = useRouter()
  const [busyId, setBusyId] = React.useState<number | null>(null)
  const [err, setErr] = React.useState<string | null>(null)

  const verifyRow = async (id: number) => {
    setErr(null)
    setBusyId(id)
    try {
      // >>> HIER der wichtige Fetch-Aufruf zur Route /api/payments/verify <<<
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Verifizierung fehlgeschlagen')
      router.refresh() // Server-Daten neu laden
    } catch (e: any) {
      setErr(e.message || 'Fehler bei Verifizierung')
    } finally {
      setBusyId(null)
    }
  }

  const rejectRow = async (id: number) => {
    setErr(null)
    setBusyId(id)
    try {
      const res = await fetch('/api/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Ablehnen fehlgeschlagen')
      router.refresh()
    } catch (e: any) {
      setErr(e.message || 'Fehler beim Ablehnen')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-2">
      {rows.length === 0 && <div className="text-zinc-400 text-sm">{emptyText}</div>}

      {rows.map((r) => (
        <div key={r.id} className="flex items-center justify-between border border-zinc-800 rounded-xl px-3 py-2">
          <div className="text-sm">
            <div className="font-medium">{r.user_name}</div>
            <div className="text-[11px] text-zinc-500">
              {new Date(r.created_at).toLocaleString()} · {r.method} · gemeldet
              {r.overpay_handling && (
                <span className="ml-2">
                  ({r.overpay_handling === 'tip' ? 'Überschuss als Trinkgeld' : 'Überschuss als Gutschrift'})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm">{euro(r.amount_cents)}</div>
            <button
              className="btn btn-primary"
              onClick={() => verifyRow(r.id)}
              disabled={busyId === r.id}
              title="Verifizieren (Überzahlungs-Logik wird automatisch korrekt angewendet)"
            >
              {busyId === r.id ? '…' : 'Verifizieren'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => rejectRow(r.id)}
              disabled={busyId === r.id}
              title="Ablehnen"
            >
              {busyId === r.id ? '…' : 'Ablehnen'}
            </button>
          </div>
        </div>
      ))}

      {err && <div className="text-xs text-red-400">{err}</div>}
    </div>
  )
}
