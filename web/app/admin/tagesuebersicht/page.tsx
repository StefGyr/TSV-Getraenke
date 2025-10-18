import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

function euro(n: number) { return (n/100).toFixed(2).replace('.', ',') + ' €' }
export const revalidate = 0

export default async function TagesuebersichtPage(){
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return <main className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">Bitte einloggen</main>
  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return <main className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">Nicht berechtigt</main>

  const start = new Date(); start.setHours(0,0,0,0)
  const end = new Date();   end.setHours(23,59,59,999)

  const [consRes, crateConsRes, payReportedRes, payVerifiedRes, drinksRes, profilesRes] = await Promise.all([
    sb.from('consumptions')
      .select('id,user_id,drink_id,quantity,source,unit_price_cents,created_at')
      .gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
      .order('created_at', { ascending: false }),
    sb.from('consumptions')
      .select('id,user_id,drink_id,quantity,source,unit_price_cents,created_at')
      .eq('source', 'crate')
      .gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
      .order('created_at', { ascending: false }),
    sb.from('payments')
      .select('id,user_id,amount_cents,method,status,created_at,tip_cents')
      .eq('status','reported')
      .gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
      .order('created_at', { ascending: false }),
    sb.from('payments')
      .select('id,user_id,amount_cents,method,status,created_at,tip_cents')
      .eq('status','verified')
      .gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
      .order('created_at', { ascending: false }),
    sb.from('drinks').select('id,name'),
    sb.from('profiles').select('id,full_name'),
  ])

  const drinks = new Map<string,string>()
  drinksRes.data?.forEach(d => drinks.set(d.id, d.name))
  const users = new Map<string,string>()
  profilesRes.data?.forEach(p => users.set(p.id, p.full_name || p.id))

  const cons = consRes.data ?? []
  const crateCons = crateConsRes.data ?? []
  const payRep = payReportedRes.data ?? []
  const payVer = payVerifiedRes.data ?? []

  const consCents = cons.reduce((s: number, r: any) => s + r.quantity * r.unit_price_cents, 0)
  const crateTaken = crateCons.reduce((s: number, r: any) => s + r.quantity, 0)
  const payRepCents = payRep.reduce((s: number, r: any) => s + r.amount_cents, 0)
  const payVerCents = payVer.reduce((s: number, r: any) => s + r.amount_cents + (r.tip_cents ?? 0), 0)

  return (
    <main className="space-y-6">
      <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400">Admin</div>
            <div className="text-xl font-semibold">Tagesübersicht</div>
            <div className="text-xs text-zinc-500">Heute: {start.toLocaleDateString()}</div>
          </div>
          <nav className="flex gap-2">
            <Link className="btn btn-ghost" href="/admin">← Dashboard</Link>
          </nav>
        </div>
      </section>

      <section className="grid sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800"><div className="text-xs text-zinc-400">Konsum (Summe)</div><div className="text-2xl font-semibold mt-1">{euro(consCents)}</div></div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800"><div className="text-xs text-zinc-400">Freibier-Entnahmen</div><div className="text-2xl font-semibold mt-1">{crateTaken} Stück</div></div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800"><div className="text-xs text-zinc-400">Zahlungen gemeldet</div><div className="text-2xl font-semibold mt-1">{euro(payRepCents)}</div></div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800"><div className="text-xs text-zinc-400">Zahlungen verifiziert</div><div className="text-2xl font-semibold mt-1">{euro(payVerCents)}</div></div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-sm font-semibold mb-2">Alle Konsumtionen heute</div>
          <div className="space-y-2">
            {cons.length === 0 && <div className="text-zinc-400 text-sm">Keine Einträge</div>}
            {cons.map((r:any)=> (
              <div key={r.id} className="flex items-center justify-between border border-zinc-800 rounded-xl px-3 py-2">
                <div>
                  <div className="text-sm">{users.get(r.user_id)}</div>
                  <div className="text-xs text-zinc-500">{new Date(r.created_at).toLocaleTimeString()} · {drinks.get(r.drink_id)} · {r.quantity}× {r.source === 'crate' ? 'aus Kiste' : 'einzeln'}</div>
                </div>
                <div className="text-right text-sm">{euro(r.quantity * r.unit_price_cents)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-sm font-semibold mb-2">Zahlungen heute</div>
          <div className="space-y-2">
            {[...(payRep ?? []), ...(payVer ?? [])].length === 0 && <div className="text-zinc-400 text-sm">Keine Einträge</div>}
            {[...(payRep ?? []), ...(payVer ?? [])].map((p:any)=> (
              <div key={p.id} className="flex items-center justify-between border border-zinc-800 rounded-xl px-3 py-2">
                <div>
                  <div className="text-sm">{users.get(p.user_id)}</div>
                  <div className="text-xs text-zinc-500">{new Date(p.created_at).toLocaleTimeString()} · {p.method} · {p.status}</div>
                </div>
                <div className="text-right text-sm">{euro(p.amount_cents)}{p.tip_cents ? ` (+ Trinkgeld ${(p.tip_cents/100).toFixed(2).replace('.', ',')} €)` : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
