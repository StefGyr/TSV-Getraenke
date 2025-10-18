import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

function euro(n: number) { return (n/100).toFixed(2).replace('.', ',') + ' €' }
export const revalidate = 0

export default async function SaldenPage(){
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return <main className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">Bitte einloggen</main>
  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return <main className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">Nicht berechtigt</main>

  const { data: rows } = await sb.from('balances_view').select('user_id, balance_cents')
  const { data: people } = await sb.from('profiles').select('id, full_name').order('full_name', { ascending: true })

  const name = new Map<string,string>()
  people?.forEach(p => name.set(p.id, p.full_name || p.id))

  const list = (rows ?? [])
    .map(r => ({ id: r.user_id, name: name.get(r.user_id) || r.user_id, balance: r.balance_cents }))
    .sort((a,b)=> a.name.localeCompare(b.name))
  const sum = list.reduce((s, r) => s + r.balance, 0)

  const csv = [
    ['User','Saldo (Cent)','Saldo (EUR)'],
    ...list.map(r => [r.name, String(r.balance), (r.balance/100).toFixed(2)]),
    ['GESAMT', String(sum), (sum/100).toFixed(2)]
  ].map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')

  return (
    <main className="space-y-6">
      <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400">Admin</div>
            <div className="text-xl font-semibold">Saldenübersicht</div>
            <div className="text-xs text-zinc-500">Kostenaufstellung je Person + Gesamt</div>
          </div>
          <nav className="flex gap-2">
            <Link className="btn btn-ghost" href="/admin">← Dashboard</Link>
            <a className="btn btn-primary" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download={`salden-${new Date().toISOString().slice(0,10)}.csv`}>
              CSV exportieren
            </a>
          </nav>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-sm text-zinc-400 mb-1">Gesamt</div>
          <div className={`text-3xl font-semibold ${sum > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
            {sum > 0 ? 'Offen: ' : 'Guthaben: '}{euro(Math.abs(sum))}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-sm text-zinc-400 mb-2">Hinweis</div>
          <div className="text-sm text-zinc-300">Positiv = offen (Schulden), Negativ = Guthaben. Kistenkäufe belasten den Zahler; Entnahmen aus Kisten sind für Spieler kostenfrei.</div>
        </div>
      </section>

      <section className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="text-sm font-semibold mb-2">Personen</div>
        <div className="space-y-2">
          {list.map(r=> (
            <div key={r.id} className="flex items-center justify-between border border-zinc-800 rounded-xl px-3 py-2">
              <div className="text-sm">{r.name}</div>
              <div className={`text-sm ${r.balance > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                {r.balance > 0 ? 'Offen: ' : 'Guthaben: '}{euro(Math.abs(r.balance))}
              </div>
            </div>
          ))}
          {list.length === 0 && <div className="text-zinc-400 text-sm">Keine Daten.</div>}
        </div>
      </section>
    </main>
  )
}
