'use client'

import React from 'react'

type Props = {
  openCents: number // positiver offener Betrag in Cent
  defaultMethod?: 'paypal' | 'cash'
  paypalLink?: string
}

function parseEuroLike(input: string): number {
  // akzeptiert: "5", "5,5", "5,50", "5.50", "€ 5,50" etc.
  let s = (input || '').trim()
  s = s.replace(/[€\s]/g, '')
  // Wenn Komma vorhanden: als Dezimaltrenner behandeln
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  const val = Number(s)
  if (!isFinite(val) || val <= 0) return 0
  return Math.round(val * 100)
}

function formatEuro(cents: number): string {
  const v = (cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return v
}

export default function PaymentForm({ openCents, defaultMethod = 'paypal', paypalLink }: Props) {
  // Interner State in **Cent**, Anzeige als Euro-String
  const [amountCents, setAmountCents] = React.useState<number>(openCents > 0 ? openCents : 0)
  const [amountText, setAmountText] = React.useState<string>(formatEuro(openCents > 0 ? openCents : 0))
  const [method, setMethod] = React.useState<'paypal' | 'cash'>(defaultMethod)
  const [note, setNote] = React.useState('')
  const [overHandling, setOverHandling] = React.useState<'credit' | 'tip'>('credit')
  const [loading, setLoading] = React.useState(false)
  const [msg, setMsg] = React.useState<string | null>(null)

  const openPos = Math.max(0, openCents)
  const overpay = Math.max(0, amountCents - openPos)

  const onAmountChange = (val: string) => {
    setAmountText(val)
    const cents = parseEuroLike(val)
    setAmountCents(cents)
  }
  const onAmountBlur = () => {
    setAmountText(formatEuro(amountCents))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setMsg(null)
    try {
      const res = await fetch('/api/payments/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: amountCents,
          method,
          note,
          overpay_handling: overpay > 0 ? overHandling : 'credit',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Fehler')
      setMsg('✓ Zahlung gemeldet – wartet auf Verifizierung')
      // Optional: zurücksetzen
      // setAmountCents(0); setAmountText('0,00'); setNote('')
    } catch (err: any) {
      setMsg(`⚠️ ${err.message || 'Fehler beim Melden'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="text-sm text-zinc-400">Offen: {formatEuro(openPos)} €</div>

      <div className="grid sm:grid-cols-2 gap-2">
        <label className="block">
          <div className="text-xs text-zinc-400 mb-1">Betrag (EUR)</div>
          <input
            className="input w-full"
            inputMode="decimal"
            placeholder="z. B. 5,00"
            value={amountText}
            onChange={(e) => onAmountChange(e.target.value)}
            onBlur={onAmountBlur}
          />
          <div className="text-[11px] text-zinc-500 mt-1">
            Eingabe wie „5,00“ oder „5.00“. Wird automatisch formatiert.
          </div>
        </label>

        <label className="block">
          <div className="text-xs text-zinc-400 mb-1">Methode</div>
          <select className="input w-full" value={method} onChange={(e) => setMethod(e.target.value as any)}>
            <option value="paypal">PayPal</option>
            <option value="cash">Bar</option>
          </select>
        </label>
      </div>

      <label className="block">
        <div className="text-xs text-zinc-400 mb-1">Notiz (optional)</div>
        <input className="input w-full" value={note} onChange={(e) => setNote(e.target.value)} placeholder="z. B. Oktober" />
      </label>

      {overpay > 0 && (
        <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60">
          <div className="text-sm font-medium">Überschuss: {formatEuro(overpay)} €</div>
          <div className="text-xs text-zinc-400 mb-2">Wie soll der Überschuss behandelt werden?</div>
          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="over"
                checked={overHandling === 'credit'}
                onChange={() => setOverHandling('credit')}
              />
              <span>Gutschrift (Saldo kann ins Guthaben drehen)</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="over"
                checked={overHandling === 'tip'}
                onChange={() => setOverHandling('tip')}
              />
              <span>Trinkgeld (Überschuss zählt nicht auf den Saldo)</span>
            </label>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button className="btn btn-primary" type="submit" disabled={loading || amountCents <= 0}>
          {loading ? 'Sende…' : 'Zahlung melden'}
        </button>
        {method === 'paypal' && !!paypalLink && (
          <a className="btn btn-ghost" href={paypalLink} target="_blank" rel="noreferrer">
            PayPal öffnen
          </a>
        )}
      </div>

      {msg && <div className="text-xs text-zinc-300">{msg}</div>}
    </form>
  )
}
