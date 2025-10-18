import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export const revalidate = 0

export default async function BestandVerlaufPage({ searchParams }: { searchParams: { drink?: string } }) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return <main className="card">Bitte <a className="underline" href="/login?next=/admin/bestand/verlauf">einloggen</a>.</main>
  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return <main className="card">Nicht berechtigt.</main>

  const { data: drinks } = await sb.from('drinks').select('id, name').order('name')
  const selectedDrink = searchParams.drink || drinks?.[0]?.id || ''

  let { data: series } = selectedDrink
    ? await sb.from('inventory_timeseries_cum')
        .select('day, stock_units')
        .eq('drink_id', selectedDrink)
        .order('day', { ascending: true })
    : { data: [] as any[] }

  series = series ?? []

  // CSV
  const csv = [
    ['Tag','Bestand (Flaschen)'],
    ...series.map((r:any) => [r.day, r.stock_units])
  ].map(row => row.join(',')).join('\n')

  return (
    <main className="space-y-6">
      <section className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400">Admin</div>
            <div className="text-xl font-semibold">Bestandsverläufe</div>
            <div className="text-xs text-zinc-500">Kumulierte Lagerbestände (nur Lager-Bewegungen)</div>
          </div>
          <nav className="flex gap-2">
            <Link href="/admin" className="btn btn-ghost">← Dashboard</Link>
            <a className="btn btn-primary" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download={`bestand-${new Date().toISOString().slice(0,10)}.csv`}>
              CSV export
            </a>
          </nav>
        </div>
      </section>

      <section className="card">
        <form method="get" className="grid sm:grid-cols-3 gap-2">
          <label className="block sm:col-span-2">
            <div className="text-xs text-zinc-400 mb-1">Getränk</div>
            <select name="drink" defaultValue={selectedDrink} className="input">
              {(drinks ?? []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button className="btn btn-primary w-full">Anzeigen</button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="text-sm font-semibold mb-3">Verlauf (letzte 90 Tage)</div>
        {series.length === 0 && <div className="text-sm text-zinc-400">Keine Daten.</div>}
        <div className="grid grid-cols-7 gap-2">
          {series.map((r:any)=> (
            <div key={r.day} className="flex flex-col items-center">
              <div className="text-xs text-zinc-500">{new Date(r.day).toLocaleDateString()}</div>
              <div className="mt-1 h-20 w-2 bg-zinc-800 rounded relative overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-emerald-500"
                  style={{ height: `${Math.min(100, (r.stock_units || 0))}%` }}
                />
              </div>
              <div className="text-xs mt-1">{r.stock_units}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-zinc-500 mt-2">Balkenhöhe skaliert grob auf 0–100. Exakte Werte stehen darunter.</div>
      </section>
    </main>
  )
}
