// web/app/admin/zahlungen/page.tsx
import { createSupabaseServer } from '@/lib/supabase-server'
import PaymentsTableClient from '@/components/admin/PaymentsTableClient'
import Link from 'next/link'

function euro(n: number) {
  return (n / 100).toFixed(2).replace('.', ',') + ' €'
}

export const revalidate = 0

type RawPayment = {
  id: number
  user_id: string
  amount_cents: number
  tip_cents?: number | null
  method: 'paypal' | 'cash'
  status: 'reported' | 'verified' | 'rejected'
  overpay_handling: 'tip' | 'credit' | null
  created_at: string
  verified_at?: string | null
}

export default async function ZahlungenPage() {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) {
    return (
      <main className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        Bitte einloggen · <Link className="underline" href="/login?next=/admin/zahlungen">Login</Link>
      </main>
    )
  }

  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') {
    return <main className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">Nicht berechtigt (Admin erforderlich)</main>
  }

  const [{ data: reported }, { data: verified }, { data: people }] = await Promise.all([
    sb.from('payments')
      .select('id,user_id,amount_cents,tip_cents,method,status,overpay_handling,created_at')
      .eq('status', 'reported')
      .order('created_at', { ascending: false }),
    sb.from('payments')
      .select('id,user_id,amount_cents,tip_cents,method,status,overpay_handling,created_at,verified_at')
      .eq('status', 'verified')
      .order('verified_at', { ascending: false })
      .limit(20),
    sb.from('profiles').select('id,full_name'),
  ])

  const name = new Map<string, string>()
  ;(people ?? []).forEach((p: any) => name.set(p.id, p.full_name || p.id))

  // >>> WICHTIG: normalize akzeptiert null/undefined und macht daraus []
  const normalize = (rowsParam: (RawPayment | any)[] | null | undefined) => {
    const rows = rowsParam ?? []
    return rows.map((r: any) => ({
      id: r.id as number,
      user_id: r.user_id as string,
      user_name: name.get(r.user_id) || r.user_id,
      amount_cents: Number(r.amount_cents) || 0,
      tip_cents: Number(r.tip_cents ?? 0) || 0,
      method: r.method as 'paypal' | 'cash',
      status: r.status as 'reported' | 'verified' | 'rejected',
      overpay_handling: (r.overpay_handling as 'tip' | 'credit' | null) ?? null,
      created_at: r.created_at as string,
      verified_at: (r.verified_at as string | null) ?? null,
    }))
  }

  const reportedRows = normalize(reported)
  const verifiedRows = normalize(verified)

  return (
    <main className="space-y-6">
      <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400">Admin</div>
            <div className="text-xl font-semibold">Zahlungen verifizieren</div>
            <div className="text-xs text-zinc-500">
              Überschuss wird als <span className="text-emerald-300">Trinkgeld</span> oder <span className="text-emerald-300">Gutschrift</span> behandelt (Nutzerwahl).
            </div>
          </div>
          <nav className="flex gap-2">
            <Link className="btn btn-ghost" href="/admin">← Dashboard</Link>
          </nav>
        </div>
      </section>

      <section className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="text-sm font-semibold mb-3">Gemeldet (wartet auf Verifizierung)</div>
        <PaymentsTableClient
          rows={reportedRows}         // garantiert ein Array
          emptyText="Keine gemeldeten Zahlungen"
        />
      </section>

      <section className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="text-sm font-semibold mb-3">Zuletzt verifiziert</div>
        <div className="space-y-2">
          {verifiedRows.length === 0 && <div className="text-zinc-400 text-sm">Noch keine verifizierten Zahlungen</div>}
          {verifiedRows.map((r) => (
            <div key={r.id} className="flex items-center justify-between border border-zinc-800 rounded-xl px-3 py-2">
              <div className="text-sm">
                {r.user_name} · {r.method} · {new Date(r.created_at).toLocaleString()}
                {r.overpay_handling === 'tip' && r.tip_cents > 0 && (
                  <span className="ml-2 text-[11px] text-emerald-300">
                    (+ Trinkgeld {(r.tip_cents/100).toFixed(2).replace('.', ',')} €)
                  </span>
                )}
              </div>
              <div className="text-sm">{euro(r.amount_cents)}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
