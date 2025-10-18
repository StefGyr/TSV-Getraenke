// web/app/admin/bewegungen/page.tsx
import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export const revalidate = 0

const euro = (n:number)=> (n/100).toFixed(2).replace('.', ',') + ' €'
const fmt  = (s:string)=> new Date(s).toLocaleString()

type Q = {
  from?: string
  to?: string
  type?: 'all'|'purchase'|'issue_from_stock'|'consumption'|'payment'
  drink?: string
  user?: string
}

export default async function BewegungenPage({ searchParams }: { searchParams: Q }) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return <main className="card">Bitte <a className="underline" href="/login?next=/admin/bewegungen">einloggen</a>.</main>
  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return <main className="card">Nicht berechtigt.</main>

  // Filter
  const fromISO = searchParams.from ? new Date(searchParams.from+'T00:00:00').toISOString() : undefined
  const toISO   = searchParams.to   ? new Date(searchParams.to  +'T23:59:59').toISOString() : undefined
  const want    = searchParams.type ?? 'all'
  const fDrink  = searchParams.drink || ''
  const fUser   = searchParams.user || ''

  // Stammdaten
  const [{ data: people }, { data: drinks }] = await Promise.all([
    sb.from('profiles').select('id, full_name').order('full_name'),
    sb.from('drinks').select('id, name').order('name'),
  ])
  const nameOf  = new Map<string,string>(); (people ?? []).forEach(p => nameOf.set(p.id, p.full_name || p.id))
  const drinkOf = new Map<string,string>(); (drinks ?? []).forEach(d => drinkOf.set(d.id, d.name))

  // ---- EINZELN ausführen (statt Promise.all mit Buildern) ----

  // Lager-Ledger
  let ledgerRows: any[] = []
  if (want === 'all' || want === 'purchase' || want === 'issue_from_stock') {
    let q = sb.from('inventory_ledger')
      .select('created_at, drink_id, kind, delta_units, note')
      .order('created_at', { ascending: false })
    if (fromISO) q = q.gte('created_at', fromISO)
    if (toISO)   q = q.lte('created_at', toISO)
    if (fDrink)  q = q.eq('drink_id', fDrink)
    const { data } = await q
    ledgerRows = data ?? []
  }

  // Konsumtionen
  let consRows: any[] = []
  if (want === 'all' || want === 'consumption') {
    let q = sb.from('consumptions')
      .select('id, created_at, user_id, drink_id, quantity, source, unit_price_cents')
      .order('created_at', { ascending: false })
    if (fromISO) q = q.gte('created_at', fromISO)
    if (toISO)   q = q.lte('created_at', toISO)
    if (fDrink)  q = q.eq('drink_id', fDrink)
    if (fUser)   q = q.eq('user_id', fUser)
    const { data } = await q
    consRows = data ?? []
  }

  // Zahlungen
  let payRows: any[] = []
  if (want === 'all' || want === 'payment') {
    let q = sb.from('payments')
      .select('id, created_at, user_id, amount_cents, tip_cents, method, status, note')
      .order('created_at', { ascending: false })
    if (fromISO) q = q.gte('created_at', fromISO)
    if (toISO)   q = q.lte('created_at', toISO)
    if (fUser)   q = q.eq('user_id', fUser)
    const { data } = await q
    payRows = data ?? []
  }

  // Mapping
  const ledger = ledgerRows.map((r:any)=> ({
    t: 'ledger',
    at: r.created_at,
    title: r.kind === 'purchase' ? 'Einkauf' : 'Kiste aus Lager',
    subtitle: drinkOf.get(r.drink_id) || r.drink_id,
    right: `${r.delta_units > 0 ? '+' : ''}${r.delta_units} Fl.`,
    note: r.note || ''
  }))

  const consumptions = consRows.map((r:any)=> ({
    t: 'cons',
    at: r.created_at,
    title: `${nameOf.get(r.user_id) || r.user_id} trinkt ${r.quantity}× ${(drinkOf.get(r.drink_id) || r.drink_id)}`,
    subtitle: r.source === 'crate' ? 'aus Kiste' : 'einzeln',
    right: euro(r.quantity * r.unit_price_cents),
    note: ''
  }))

  const payments = payRows.map((p:any)=> ({
    t: 'pay',
    at: p.created_at,
    title: `${nameOf.get(p.user_id) || p.user_id} zahlt (${p.method})`,
    subtitle: p.status,
    right: `${euro(p.amount_cents)}${p.tip_cents ? ` (+ Trinkgeld ${euro(p.tip_cents)})` : ''}`,
    note: p.note || ''
  }))

  const rows = [...ledger, ...consumptions, ...payments]
    .sort((a,b)=> new Date(b.at).getTime() - new Date(a.at).getTime())

  // CSV
  const csv = [
    ['Zeit', 'Typ', 'Titel', 'Details', 'Betrag/Delta', 'Notiz'],
    ...rows.map(r => [fmt(r.at), r.t, r.title, r.subtitle, r.right, r.note])
  ].map(line => line.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')

  return (
    <main className="space-y-6">
      <section className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400">Admin</div>
            <div className="text-xl font-semibold">Bewegungsliste</div>
            <div className="text-xs text-zinc-500">Einkäufe · Lagerabgänge · Konsumtionen · Zahlungen</div>
          </div>
          <nav className="flex gap-2">
            <Link href="/admin" className="btn btn-ghost">← Dashboard</Link>
            <a className="btn btn-primary" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download={`bewegungen-${new Date().toISOString().slice(0,10)}.csv`}>CSV export</a>
          </nav>
        </div>
      </section>

      {/* Filter */}
      <section className="card">
        <form method="get" className="grid sm:grid-cols-6 gap-2">
          <label className="block">
            <div className="text-xs text-zinc-400 mb-1">Von</div>
            <input className="input" type="date" name="from" defaultValue={searchParams.from || ''} />
          </label>
          <label className="block">
            <div className="text-xs text-zinc-400 mb-1">Bis</div>
            <input className="input" type="date" name="to" defaultValue={searchParams.to || ''} />
          </label>
          <label className="block">
            <div className="text-xs text-zinc-400 mb-1">Typ</div>
            <select className="input" name="type" defaultValue={searchParams.type || 'all'}>
              <option value="all">Alle</option>
              <option value="purchase">Einkauf</option>
              <option value="issue_from_stock">Kiste aus Lager</option>
              <option value="consumption">Konsum</option>
              <option value="payment">Zahlungen</option>
            </select>
          </label>
          <label className="block">
            <div className="text-xs text-zinc-400 mb-1">Getränk</div>
            <select className="input" name="drink" defaultValue={searchParams.drink || ''}>
              <option value="">— alle —</option>
              {(drinks ?? []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className="block">
            <div className="text-xs text-zinc-400 mb-1">Person</div>
            <select className="input" name="user" defaultValue={searchParams.user || ''}>
              <option value="">— alle —</option>
              {(people ?? []).map(p => <option key={p.id} value={p.id}>{p.full_name || p.id}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button className="btn btn-primary w-full">Filtern</button>
          </div>
        </form>
      </section>

      {/* Liste */}
      <section className="card">
        <div className="space-y-2">
          {rows.length === 0 && <div className="text-sm text-zinc-400">Keine Einträge.</div>}
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between border border-zinc-800 rounded-xl px-3 py-2">
              <div>
                <div className="text-sm">{r.title}</div>
                <div className="text-xs text-zinc-500">{fmt(r.at)} · {r.subtitle}{r.note ? ` · ${r.note}` : ''}</div>
              </div>
              <div className="text-sm">{r.right}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
