'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BookModal({
  drinkId,
  drinkName,
  priceEuro, // z.B. "2,50 €"
}: {
  drinkId: string
  drinkName: string
  priceEuro: string
}) {
  const [open, setOpen] = useState(false)
  const [qty, setQty] = useState('1')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const router = useRouter()

  function addDigit(d: string) {
    setQty((q) => {
      const v = (q === '0') ? d : (q + d)
      const n = Math.max(1, Math.min(999, parseInt(v || '0', 10)))
      return String(n)
    })
  }
  function clearQty() { setQty('1') }

  async function confirm() {
    setBusy(true); setErr(null)
    try {
      const form = new FormData()
      form.set('drinkId', drinkId)
      form.set('quantity', qty)
      const res = await fetch('/verbuchen/book', { method: 'POST', body: form })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `HTTP ${res.status}`)
      }
      // Erfolg → Modal schließen, Seite/Saldo refreshen
      setOpen(false)
      clearQty()
      router.refresh() // aktualisiert Server-Komponenten (Saldo z. B. auf Startseite)
    } catch (e: any) {
      setErr(e?.message ?? 'Unbekannter Fehler')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button className="btn-primary" type="button" onClick={() => setOpen(true)}>Verbuchen</button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
            <div className="mb-2">
              <div className="text-xs text-zinc-400">Bestätigung</div>
              <div className="text-lg font-semibold">
                {drinkName} verbuchen? <span className="text-[var(--primary)]">{priceEuro}</span> pro Stück
              </div>
              <div className="text-xs text-zinc-500 mt-1">Wird deinem Konto gutgeschrieben (offener Betrag steigt).</div>
            </div>

            <div className="mb-3">
              <div className="text-sm text-zinc-400 mb-1">Menge</div>
              <input
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-center text-2xl font-mono"
                inputMode="numeric"
                value={qty}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D+/g, '')
                  setQty(v === '' ? '1' : String(Math.max(1, Math.min(999, parseInt(v, 10)))))
                }}
              />
            </div>

            {/* Tastenfeld 1–9 */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {['1','2','3','4','5','6','7','8','9'].map(n => (
                <button key={n} type="button"
                  onClick={() => addDigit(n)}
                  className="py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-[0.98]">
                  {n}
                </button>
              ))}
              <button type="button" onClick={() => setQty(String(Math.max(1, (parseInt(qty,10)||1) - 1)))}
                className="py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">–1</button>
              <button type="button" onClick={() => clearQty()}
                className="py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">C</button>
              <button type="button" onClick={() => setQty(String((parseInt(qty,10)||1) + 1))}
                className="py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">+1</button>
            </div>

            {err && <div className="text-red-400 text-sm mb-2">{err}</div>}

            <div className="flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setOpen(false)} disabled={busy}>Abbrechen</button>
              <button type="button" className="btn-primary flex-1" onClick={confirm} disabled={busy}>
                {busy ? 'Verbuchen…' : 'Bestätigen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
