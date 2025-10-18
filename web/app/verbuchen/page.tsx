import { createSupabaseServer } from '@/lib/supabase-server'

export const revalidate = 0

function euro(n: number) {
  return (n / 100).toFixed(2).replace('.', ',') + ' €'
}

type Search = { ok?: string; err?: string }

export default async function VerbuchenPage({ searchParams }: { searchParams?: Search }) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) {
    return (
      <main className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        Bitte einloggen · <a className="underline" href="/login?next=/verbuchen">Login</a>
      </main>
    )
  }

  // Drinks, Preise, aktive Kisten (Freibier-Segmente)
  const [{ data: drinks }, { data: prices }, { data: crates }] = await Promise.all([
    sb.from('drinks')
      .select('id,name,unit,segments_per_crate,is_active')
      .eq('is_active', true)
      .order('name', { ascending: true }),
    sb.from('current_prices').select('drink_id, price_cents'),
    sb.from('crates')
      .select('drink_id, remaining_segments, is_active')
      .eq('is_active', true),
  ])

  const price = new Map<string, number>()
  prices?.forEach(p => price.set(p.drink_id, p.price_cents))

  const freibierSeg = new Map<string, number>()
  crates?.forEach(c => {
    const prev = freibierSeg.get(c.drink_id) || 0
    freibierSeg.set(c.drink_id, prev + (c.remaining_segments || 0))
  })

  const ok = searchParams?.ok
  const err = searchParams?.err

  const okText =
    ok === 'single' ? 'Erfolgreich verbucht.' :
    ok === 'crate'  ? 'Aus Kiste verbucht.' :
    ok === 'issued' ? 'Kiste ausgegeben.' :
    undefined

  const errText =
    err === 'bad_input'         ? 'Bitte gültige Eingaben machen.' :
    err === 'no_price'          ? 'Kein Preis hinterlegt.' :
    err === 'no_crate'          ? 'Keine aktive Kiste vorhanden.' :
    err === 'not_enough_crate'  ? 'Nicht genug Segmente in aktiven Kisten.' :
    err === 'insert'            ? 'Buchung fehlgeschlagen.' :
    err === 'crate_update'      ? 'Kisten-Update fehlgeschlagen.' :
    err === 'crate_insert'      ? 'Kiste konnte nicht angelegt werden.' :
    err === 'cons_insert'       ? 'Kisten-Kosten konnten nicht verbucht werden.' :
    err === 'no_segments'       ? 'Kein Kistenumfang (Segmente) hinterlegt.' :
    err === 'server'            ? 'Serverfehler – bitte später erneut versuchen.' :
    undefined

  return (
    <main className="space-y-6">
      {/* Kopf */}
      <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400">Verbuchung</div>
            <div className="text-xl font-semibold">Getränke & Kisten</div>
          </div>
          <nav className="flex gap-3 text-sm">
            <a className="hover:underline" href="/">Start</a>
            <a className="hover:underline" href="/terminal">Terminal</a>
            <a className="hover:underline" href="/ich">Ich</a>
          </nav>
        </div>

        {/* Status-Banner */}
        {okText && (
          <div className="mt-3 rounded-xl border border-emerald-700 bg-emerald-900/40 px-3 py-2 text-sm">
            {okText}
          </div>
        )}
        {errText && (
          <div className="mt-3 rounded-xl border border-red-700 bg-red-900/40 px-3 py-2 text-sm">
            {errText}
          </div>
        )}
      </section>

      {/* Modus-Karten */}
      <section className="grid lg:grid-cols-3 gap-4">
        {/* A) Kostenpflichtiges Getränk */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-xs text-zinc-400 mb-1">Modus</div>
          <div className="text-lg font-semibold mb-3">Kostenpflichtiges Getränk</div>
          <div className="space-y-3">
            {(drinks ?? []).map(d => (
              <form key={d.id} action="/verbuchen/book" method="post" className="flex items-end gap-2 border border-zinc-800 rounded-xl p-3">
                <input type="hidden" name="drinkId" value={d.id} />
                <div className="flex-1">
                  <div className="text-sm">{d.name}</div>
                  <div className="text-xs text-zinc-400">
                    {price.has(d.id) ? `${euro(price.get(d.id)!)} / ${d.unit}` : '— kein Preis'}
                  </div>
                </div>
                <label className="text-xs text-zinc-400">
                  Menge
                  <input
                    name="qty"
                    defaultValue={1}
                    min={1}
                    inputMode="numeric"
                    className="block w-20 mt-1 rounded-xl bg-zinc-900 border border-zinc-800 px-2 py-2 text-right"
                  />
                </label>
                <button className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm">
                  Buchen
                </button>
              </form>
            ))}
          </div>
        </div>

        {/* B) Freibier (aus Kiste) */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-xs text-zinc-400 mb-1">Modus</div>
          <div className="text-lg font-semibold mb-3">Frei*bier* (aus Kiste)</div>
          <div className="space-y-3">
            {(drinks ?? []).map(d => {
              const seg = freibierSeg.get(d.id) || 0
              const has = seg > 0
              return (
                <form key={d.id} action="/verbuchen/book-from-crate" method="post" className="flex items-end gap-2 border border-zinc-800 rounded-xl p-3">
                  <input type="hidden" name="drinkId" value={d.id} />
                  <div className="flex-1">
                    <div className="text-sm">{d.name}</div>
                    <div className={`text-xs ${has ? 'text-amber-300' : 'text-zinc-400'}`}>
                      {has ? `Frei*bier* aktiv · ${seg} Segmente` : '— keine aktive Kiste'}
                    </div>
                  </div>
                  <label className="text-xs text-zinc-400">
                    Menge
                    <input
                      name="qty"
                      defaultValue={1}
                      min={1}
                      inputMode="numeric"
                      className="block w-20 mt-1 rounded-xl bg-zinc-900 border border-zinc-800 px-2 py-2 text-right"
                      disabled={!has}
                    />
                  </label>
                  <button
                    className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm disabled:opacity-50"
                    disabled={!has}
                  >
                    Aus Kiste buchen
                  </button>
                </form>
              )
            })}
          </div>
        </div>

        {/* C) Kiste ausgeben */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-xs text-zinc-400 mb-1">Modus</div>
          <div className="text-lg font-semibold mb-3">Kiste ausgeben</div>
          <div className="space-y-3">
            {(drinks ?? []).map(d => {
              const single = price.get(d.id) || 0
              const segments = d.segments_per_crate || 20
              const approxCrate = single * segments
              return (
                <form key={d.id} action="/verbuchen/issue-crate" method="post" className="border border-zinc-800 rounded-xl p-3">
                  <input type="hidden" name="drinkId" value={d.id} />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-sm">{d.name}</div>
                      <div className="text-xs text-zinc-400">
                        Kisten-Richtwert: {euro(approxCrate)} · {segments} {d.unit || 'Einheiten'}
                      </div>
                      <select
                        name="issueMode"
                        className="mt-2 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-2 py-2 text-sm"
                        defaultValue="own_money"
                      >
                        <option value="own_money">Ich bezahle die Kiste (kostenpflichtig)</option>
                        <option value="bring_crate">Ich bringe eine Kiste mit (kostenlos, nur Bestand)</option>
                      </select>
                    </div>
                    <button className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-sm">
                      Ausgeben
                    </button>
                  </div>
                </form>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
