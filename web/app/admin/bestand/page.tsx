import { createSupabaseServer } from '@/lib/supabase-server'

export const revalidate = 0
const euro = (n:number)=> (n/100).toFixed(2).replace('.', ',') + ' €'

export default async function BestandPage() {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return <main className="card">Bitte einloggen</main>
  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return <main className="card">Nicht berechtigt</main>

  const [{ data: drinks }, { data: coldCrates }, { data: issuedCrates }, { data: pending }] = await Promise.all([
    sb.from('drinks').select('id, name, segments_per_crate'),
    sb.from('crates').select('id, drink_id, remaining_segments, created_at').eq('location','coldroom').eq('is_active', true).order('created_at'),
    sb.from('crates').select('id, drink_id, remaining_segments, origin, price_cents, created_at').eq('location','issued').eq('is_active', true).order('created_at'),
    sb.from('crate_requests').select('id, user_id, drink_id, request_type, price_cents, created_at, note').eq('status','pending').order('created_at'),
  ])

  // Mapping
  const coldByDrink = new Map<string, any[]>()
  ;(coldCrates ?? []).forEach(c => {
    const arr = coldByDrink.get(c.drink_id) ?? []
    arr.push(c); coldByDrink.set(c.drink_id, arr)
  })
  const issuedByDrink = new Map<string, any[]>()
  ;(issuedCrates ?? []).forEach(c => {
    const arr = issuedByDrink.get(c.drink_id) ?? []
    arr.push(c); issuedByDrink.set(c.drink_id, arr)
  })

  async function addColdroomCrate(formData: FormData) {
    'use server'
    const sb = await createSupabaseServer()
    const drinkId = String(formData.get('drinkId') || '')
    const segs = Number(formData.get('segs') || 20)
    if (!drinkId) throw new Error('drinkId fehlt')
    await sb.from('crates').insert({
      drink_id: drinkId,
      total_segments: segs,
      remaining_segments: segs,
      is_active: true,
      location: 'coldroom',
      origin: 'stock',
      approval_status: 'approved'
    })
  }

  async function removeColdroomCrate(formData: FormData) {
    'use server'
    const sb = await createSupabaseServer()
    const crateId = String(formData.get('crateId') || '')
    if (!crateId) throw new Error('crateId fehlt')
    // „Entsorgen“: inaktiv
    await sb.from('crates').update({ is_active:false }).eq('id', crateId)
  }

  async function decide(id: string, approve: boolean) {
    'use server'
    const sb = await createSupabaseServer()
    const { error } = await sb.rpc('approve_crate_request', {
      p_request_id: id, p_approve: approve, p_note: approve ? 'OK' : 'abgelehnt'
    })
    if (error) throw new Error(error.message)
  }

  return (
    <main className="space-y-6">
      <section className="card">
        <div className="text-xs text-zinc-400">Admin</div>
        <div className="text-xl font-semibold">Bestand (Kühlraum & Ausgegeben)</div>
        <div className="text-xs text-zinc-500">Kühlraum = Lager; Ausgegeben = aktive Team-Kisten</div>
      </section>

      {/* Kühlraum pflegen */}
      <section className="card">
        <div className="text-sm font-semibold mb-2">Kühlraum</div>
        <div className="space-y-4">
          {(drinks ?? []).map(d => (
            <div key={d.id} className="border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-zinc-400">
                  {(coldByDrink.get(d.id)?.length ?? 0)} Kisten à {d.segments_per_crate}
                </div>
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                {(coldByDrink.get(d.id) ?? []).map((c:any)=> (
                  <form key={c.id} action={removeColdroomCrate}>
                    <input type="hidden" name="crateId" value={c.id}/>
                    <button className="btn btn-ghost text-xs" type="submit">– entfernen</button>
                  </form>
                ))}
                <form action={addColdroomCrate} className="flex gap-2 items-center">
                  <input type="hidden" name="drinkId" value={d.id}/>
                  <input className="input w-24" name="segs" defaultValue={d.segments_per_crate} />
                  <button className="btn btn-primary" type="submit">+ Kiste</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ausgegeben */}
      <section className="card">
        <div className="text-sm font-semibold mb-2">Ausgegeben (aktiv)</div>
        <div className="space-y-4">
          {(drinks ?? []).map(d => (
            <div key={d.id} className="border border-zinc-800 rounded-xl p-3">
              <div className="font-medium">{d.name}</div>
              <div className="mt-2 grid sm:grid-cols-2 gap-2">
                {(issuedByDrink.get(d.id) ?? []).map((c:any)=> (
                  <div key={c.id} className="flex items-center justify-between border border-zinc-800 rounded-lg px-3 py-2">
                    <div className="text-sm">
                      {c.origin === 'brought' ? 'mitgebracht' : 'aus Lager'} · Rest: {c.remaining_segments}
                      {typeof c.price_cents === 'number' ? ` · ${euro(c.price_cents)}` : ''}
                    </div>
                    <div className="text-xs text-zinc-400">{new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
                {(issuedByDrink.get(d.id) ?? []).length === 0 && (
                  <div className="text-sm text-zinc-400">Keine aktive Kiste</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Offene Ausgabewünsche */}
      <section className="card">
        <div className="text-sm font-semibold mb-2">Offene Anfragen (Kiste ausgeben)</div>
        <div className="space-y-2">
          {(pending ?? []).length === 0 && <div className="text-sm text-zinc-400">Keine offenen Anfragen</div>}
          {(pending ?? []).map((r:any)=> (
            <form
              key={r.id}
              action={async () => { 'use server'; const sb=await createSupabaseServer(); await sb.rpc('approve_crate_request',{ p_request_id:r.id, p_approve:true, p_note:'OK'}); }}
              className="flex items-center justify-between border border-zinc-800 rounded-xl px-3 py-2"
            >
              <div className="text-sm">
                [{r.request_type === 'issue_from_stock' ? 'aus Kühlraum' : 'mitgebracht'}] Getränk {r.drink_id}
                {r.price_cents ? ` · ${euro(r.price_cents)}` : ''} · {new Date(r.created_at).toLocaleString()}
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary" type="submit">Genehmigen</button>
                <button
                  formAction={async () => { 'use server'; const sb=await createSupabaseServer(); await sb.rpc('approve_crate_request',{ p_request_id:r.id, p_approve:false, p_note:'abgelehnt'}); }}
                  className="btn btn-ghost"
                  type="submit"
                >
                  Ablehnen
                </button>
              </div>
            </form>
          ))}
        </div>
      </section>
    </main>
  )
}
