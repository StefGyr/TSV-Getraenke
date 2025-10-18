'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TerminalBookButton({
  drinkId,
  drinkName,
  priceEuro,
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

  function setQtySafe(v: string) {
    const only = v.replace(/\D+/g, '')
    if (!only) return setQty('1')
    const n = Math.max(1, Math.min(999, parseInt(only, 10)))
    setQty(String(n))
  }

  async function confirm() {
    setBusy(true); setErr(null)
    try {
      const fd = new FormData()
      fd.set('drinkId', drinkId)
      fd.set('quantity', qty)

      const res = await fetch('/terminal/book', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin', // ⬅️ Cookie terminal_uid sicher mitsenden
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`)
      }

      // Erfolg → Modal zu, Menge zurücksetzen, Seite refreshen
      setOpen(false)
      setQty('1')
      router.refresh()
    } catch (e: any) {
      setErr(e?.message ?? 'Unbekannter Fehler')
      // optional: console.error(e)
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
              <div className="text-xs text-zinc-500 mt-1">Wird auf den PIN-Nutzer gebucht.</div>
            </div>

            <div className="mb-3">
              <div className="text-sm text-zinc-400 mb-1">Menge</div>
              <input
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-center text-2xl font-mono"
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQtySafe(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {['1','2','3','4','5','6','7','8','9'].map(n => (
                <button key={n} type="button"
                        onClick={() => setQtySafe((qty === '0' ? n : qty + n))}
                        className="py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">
                  {n}
                </button>
              ))}
              <button type="button" onClick={() => setQtySafe(String(Math.max(1, (parseInt(qty,10)||1)-1)))}
                      className="py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">–1</button>
              <button type="button" onClick={() => setQty('1')}
                      className="py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">C</button>
              <button type="button" onClick={() => setQtySafe(String((parseInt(qty,10)||1)+1))}
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
