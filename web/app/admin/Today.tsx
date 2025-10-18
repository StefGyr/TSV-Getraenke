'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function Today() {
  const [consCents, setConsCents] = useState(0)  // heute verbraucht (in Cent)
  const [consCount, setConsCount] = useState(0)  // Anzahl Buchungen heute
  const [payCents, setPayCents] = useState(0)    // heute verifizierte Zahlungen (in Cent)
  const [payCount, setPayCount] = useState(0)    // Anzahl verifizierter Zahlungen

  useEffect(() => {
    let alive = true
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const isoStart = start.toISOString()

    ;(async () => {
      // Buchungen heute
      const { data: cons } = await supabase
        .from('consumptions')
        .select('quantity,unit_price_cents,created_at')
        .gte('created_at', isoStart)

      // Zahlungen heute (nur verifiziert)
      const { data: pays } = await supabase
        .from('payments')
        .select('amount_cents,status,created_at')
        .gte('created_at', isoStart)

      if (!alive) return

      const cCents =
        (cons ?? []).reduce((s, x) => s + x.quantity * x.unit_price_cents, 0)
      const verified = (pays ?? []).filter((p) => p.status === 'verified')
      const pCents = verified.reduce((s, x) => s + x.amount_cents, 0)

      setConsCents(cCents)
      setConsCount(cons?.length ?? 0)
      setPayCents(pCents)
      setPayCount(verified.length)
    })()

    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="text-lg font-semibold mb-3">Heute</div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-zinc-400">Verbrauch</div>
          <div className="text-2xl font-mono">€ {(consCents / 100).toFixed(2)}</div>
          <div className="text-xs text-zinc-500">{consCount} Buchungen</div>
        </div>
        <div>
          <div className="text-sm text-zinc-400">Zahlungen (verifiziert)</div>
          <div className="text-2xl font-mono text-[var(--primary)]">
            € {(payCents / 100).toFixed(2)}
          </div>
          <div className="text-xs text-zinc-500">{payCount} Tickets</div>
        </div>
      </div>
    </div>
  )
}
