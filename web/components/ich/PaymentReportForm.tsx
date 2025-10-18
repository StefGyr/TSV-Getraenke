'use client'
import * as React from 'react'

type Method = 'paypal' | 'cash'
type Handling = 'tip' | 'credit'

export default function PaymentReportForm({
  paypalLink,
}: {
  paypalLink?: string
}) {
  const [amount, setAmount] = React.useState('')       // Eingabe in EUR, z. B. "10,50"
  const [method, setMethod] = React.useState<Method>('paypal')
  const [handling, setHandling] = React.useState<Handling>('tip')
  const [note, setNote] = React.useState('')
  const [msg, setMsg] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  function parseEuroToCents(input: string): number {
    // Erlaubt "10,50", "10.50", "10"
    const cleaned = input.trim().replace(/\./g, '').replace(',', '.')
    const val = Number(cleaned)
    if (!isFinite(val) || val <= 0) return 0
    return Math.round(val * 100)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    const cents = parseEuroToCents(amount)
    if (cents <= 0) {
      setMsg('Bitte einen gültigen Betrag eingeben.')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.set('amount_cents', String(cents))
      fd.set('method', method)
      fd.set('overpay_handling', handling)
      if (note) fd.set('note', note)

      const res = await fetch('/api/payments/report', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(await res.text())

      setMsg('Zahlung gemeldet. Warte auf Verifizierung.')
      setAmount('')
      setNote('')

      // Bei PayPal optional Link öffnen
      if (method === 'paypal' && paypalLink) {
        window.open(paypalLink, '_blank', 'noopener,noreferrer')
      }
    } catch (err: any) {
      setMsg('Fehler: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
      <div className="text-sm font-semibold">Zahlung melden</div>

      <div className="grid sm:grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-zinc-400">Betrag (EUR)</label>
          <input
            className="input"
            placeholder="z. B. 10,00"
            inputMode="decimal"
            value={amount}
            onChange={(e)=>setAmount(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs text-zinc-400">Zahlart</label>
          <select className="input" value={method} onChange={(e)=>setMethod(e.target.value as Method)}>
            <option value="paypal">PayPal</option>
            <option value="cash">Bar</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-zinc-400">Überzahlung behandeln als</label>
          <select className="input" value={handling} onChange={(e)=>setHandling(e.target.value as Handling)}>
            <option value="tip">Trinkgeld (Saldo bleibt)</option>
            <option value="credit">Gutschrift (Saldo sinkt)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-zinc-400">Notiz (optional)</label>
        <input
          className="input"
          placeholder="z. B. Mannschaftskasse"
          value={note}
          onChange={(e)=>setNote(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        {method === 'paypal' && !!paypalLink ? (
          <a className="btn btn-ghost" href={paypalLink} target="_blank" rel="noopener noreferrer">
            PayPal öffnen
          </a>
        ) : <div />}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Sende…' : 'Zahlung melden'}
        </button>
      </div>

      {msg && <div className="text-xs text-zinc-400">{msg}</div>}
    </form>
  )
}
