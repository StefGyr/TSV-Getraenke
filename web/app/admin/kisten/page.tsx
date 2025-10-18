// web/app/admin/kisten/page.tsx
import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import SegmentBar from '@/components/SegmentBar'

function euro(cents: number | null | undefined) {
  if (cents == null) return '—'
  return (cents / 100).toFixed(2).replace('.', ',') + ' €'
}

export default async function AdminKistenPage() {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return <main className="p-6">Bitte einloggen</main>
  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return <main className="p-6">Nicht berechtigt</main>

  const { data: drinks } = await sb.from('drinks').select('id,name,segments_per_crate').order('name')
  const { data: prices } = await sb.from('current_prices').select('*')
  const { data: users } = await sb.from('profiles').select('id, full_name').order('full_name', { ascending: true }).limit(200)

  const priceMap = new Map<string, number>()
  ;(prices ?? []).forEach((p: any) => priceMap.set(p.drink_id, p.price_cents))

  const { data: crates } = await sb
    .from('crates')
    .select('id,drink_id,total_segments,remaining_segments,is_active,created_at,paid_by,purchase_cents')
    .order('created_at', { ascending: false })

  return (
    <main className="space-y-6">
      <section className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
        <div>
          <div className="text-xs text-zinc-400">Admin</div>
          <div className="text-xl font-semibold">Kisten</div>
        </div>
        <nav className="flex gap-3 text-sm">
          <Link className="hover:underline" href="/admin">← Dashboard</Link>
        </nav>
      </section>

      {/* Kiste anlegen */}
      <section className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <form action="/admin/kisten/add" method="post" className="grid sm:grid-cols-4 gap-2">
          <select name="drinkId" className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2" required>
            <option value="">Getränk wählen…</option>
            {(drinks ?? []).map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <input name="segments" placeholder="Segmente (z. B. 20)" inputMode="numeric"
                 className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2" required />
          <button className="btn-primary" type="submit">Kiste anlegen</button>
        </form>
      </section>

      {/* Liste */}
      <section className="space-y-3">
        {(crates ?? []).map((c: any) => {
          const d = (drinks ?? []).find((x: any) => x.id === c.drink_id)
          const price = priceMap.get(c.drink_id) ?? null
          return (
            <div key={c.id} className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-semibold">{d?.name || 'Unbekannt'}</div>
                  <div className="text-xs text-zinc-400">
                    Segmente: {c.remaining_segments}/{c.total_segments} · {new Date(c.created_at).toLocaleString()}
                    {c.purchase_cents ? <> · bezahlt: {euro(c.purchase_cents)}{c.paid_by ? ' (hinterlegt)' : ''}</> : null}
                  </div>
                  <div className="mt-2"><SegmentBar total={c.total_segments} remaining={c.remaining_segments} /></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Aktivieren/Deaktivieren */}
                  <form action="/admin/kisten/toggle" method="post">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="next" value={(!c.is_active).toString()} />
                    <button className="btn-ghost" type="submit">
                      {c.is_active ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                  </form>

                  {/* Kiste ausgeben (komplett bezahlen) */}
                  <form action="/admin/kisten/issue" method="post" className="flex gap-2 items-center">
                    <input type="hidden" name="crateId" value={c.id} />
                    <select name="payerId" className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2" required>
                      <option value="">Zahler wählen…</option>
                      {(users ?? []).map((u:any) => (
                        <option key={u.id} value={u.id}>{u.full_name || u.id}</option>
                      ))}
                    </select>
                    <button className="btn-primary" type="submit">Kiste ausgeben</button>
                  </form>
                </div>
              </div>
            </div>
          )
        })}
        {(crates ?? []).length === 0 && (
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-400">
            Noch keine Kisten angelegt.
          </div>
        )}
      </section>
    </main>
  )
}
