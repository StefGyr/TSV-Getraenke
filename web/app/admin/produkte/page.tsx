import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'

export const revalidate = 0

function euro(n: number | null | undefined) {
  if (!n && n !== 0) return '—'
  return (n / 100).toFixed(2).replace('.', ',') + ' €'
}

export default async function ProduktePage() {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()

  if (!user) {
    return (
      <main className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        Bitte einloggen · <a className="underline" href="/login?next=/admin/produkte">Login</a>
      </main>
    )
  }

  const { data: me } = await sb.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (me?.role !== 'admin') {
    return (
      <main className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        Nicht berechtigt
      </main>
    )
  }

  // Getränke + aktueller Einzelpreis + (optional) Kistenpreis, falls Spalte existiert
  // Wir holen current_prices (View) und drinks. Wenn es eine Spalte "crate_price_cents" gibt, verwenden wir sie.
  const [drinksRes, pricesRes] = await Promise.all([
    sb.from('drinks').select('id,name,unit,segments_per_crate,is_active,crate_price_cents').order('name'),
    sb.from('current_prices').select('drink_id,price_cents'),
  ])

  const priceMap = new Map<string, number>()
  ;(pricesRes.data ?? []).forEach(p => priceMap.set(p.drink_id, p.price_cents))

  const drinks = (drinksRes.data ?? []).map(d => ({
    ...d,
    price_cents: priceMap.get(d.id) ?? null as number | null,
    crate_price_cents: (d as any).crate_price_cents ?? null as number | null,
  }))

  return (
    <main className="space-y-6">
      {/* Header */}
      <section className="p-4 sm:p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400">Admin</div>
            <div className="text-xl font-semibold">Produkte verwalten</div>
            <div className="text-xs text-zinc-500">Einzel- und Kistenpreise, Aktivierung, Segmente je Kiste</div>
          </div>
          <nav className="flex gap-2">
            <Link href="/admin" className="btn btn-ghost">← Dashboard</Link>
          </nav>
        </div>
      </section>

      {/* Neues Getränk */}
      <section className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="text-sm font-semibold mb-2">Neues Getränk</div>

        {/* WICHTIG: KEIN method/encType setzen, wenn du Server-Actions nutzt.
           Hier arbeiten wir aber bewusst mit normalen Routes → method="post" erlaubt. */}
        <form action="/admin/produkte/add" method="post" className="grid sm:grid-cols-6 gap-2">
          <input name="name" placeholder="Name (z. B. Bier)" className="input" required />
          <input name="unit" placeholder="Einheit (z. B. Flasche)" className="input" defaultValue="Flasche" />
          <input name="segments" placeholder="Flaschen pro Kiste" className="input" inputMode="numeric" defaultValue={20} />
          <input name="price_eur" placeholder="Einzelpreis (€)" className="input" inputMode="decimal" />
          <input name="crate_price_eur" placeholder="Kistenpreis (€) (optional)" className="input" inputMode="decimal" />
          <button type="submit" className="btn btn-primary">Anlegen</button>
        </form>
      </section>

      {/* Liste */}
      <section className="space-y-3">
        {drinks.map(d => (
          <div key={d.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">{d.name}</div>
                <div className="text-xs text-zinc-400">
                  Einheit: {d.unit} · Segmente/Kiste: {d.segments_per_crate}
                </div>
              </div>
              <div className="text-sm text-right">
                <div>Einzelpreis: <span className="font-mono">{euro(d.price_cents)}</span></div>
                <div className="text-xs text-zinc-400">Kistenpreis: <span className="font-mono">{euro(d.crate_price_cents)}</span></div>
              </div>
            </div>

            {/* Preise setzen + ggf. Segmente anpassen */}
            <div className="mt-3 grid sm:grid-cols-6 gap-2">
              <form action="/admin/produkte/set-price" method="post" className="sm:col-span-6 grid sm:grid-cols-6 gap-2">
                <input type="hidden" name="drinkId" value={d.id} />
                <label className="block">
                  <div className="text-xs text-zinc-400 mb-1">Einzelpreis (€)</div>
                  <input name="price_eur" className="input" placeholder="z. B. 2,50" inputMode="decimal" />
                </label>
                <label className="block">
                  <div className="text-xs text-zinc-400 mb-1">Kistenpreis (€) (optional)</div>
                  <input name="crate_price_eur" className="input" placeholder="z. B. 45,00" inputMode="decimal" />
                </label>
                <label className="block">
                  <div className="text-xs text-zinc-400 mb-1">Segmente/Kiste</div>
                  <input name="segments" className="input" defaultValue={d.segments_per_crate} inputMode="numeric" />
                </label>
                <div className="sm:col-span-3 flex items-end">
                  <button type="submit" className="btn btn-primary w-full">Speichern</button>
                </div>
              </form>
            </div>

            {/* Aktiv / Inaktiv */}
            <div className="mt-3">
              <form action="/admin/produkte/toggle" method="post" className="inline-flex gap-2">
                <input type="hidden" name="drinkId" value={d.id} />
                <input type="hidden" name="to" value={(!d.is_active).toString()} />
                <button type="submit" className={`btn ${d.is_active ? 'btn-ghost' : 'btn-primary'}`}>
                  {d.is_active ? 'Deaktivieren' : 'Aktivieren'}
                </button>
              </form>
            </div>
          </div>
        ))}

        {drinks.length === 0 && (
          <div className="p-4 rounded-xl border border-zinc-800 text-zinc-400">
            Noch keine Getränke angelegt.
          </div>
        )}
      </section>
    </main>
  )
}

/* — kleine Utility-Klassen für Inputs/Buttons —
   (Du hast die Klassen wahrscheinlich schon global;
    falls nicht, funktionieren sie auch so mit Tailwind) */
const _never = null
