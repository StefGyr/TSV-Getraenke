// web/app/page.tsx
export const revalidate = 0

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>
}) {
  // ⬇️ Next 15: searchParams ist ein Promise
  const sp = await searchParams
  const ok = sp.ok
  const err = sp.err

  return (
    <main className="space-y-6">
      <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="text-sm text-zinc-400">Willkommen</div>
        <div className="text-xl font-semibold">TSV Getränke – Start</div>
        <div className="text-xs text-zinc-500">Schneller Zugriff auf alle Bereiche</div>
      </section>

      {ok && (
        <section className="p-4 rounded-xl border border-emerald-900/40 bg-emerald-900/20 text-emerald-200 text-sm">
          {ok === 'login' && 'Erfolgreich eingeloggt.'}
          {ok === 'logout' && 'Erfolgreich abgemeldet.'}
        </section>
      )}
      {err && (
        <section className="p-4 rounded-xl border border-red-900/40 bg-red-900/20 text-red-200 text-sm">
          {err === 'bad_pin' ? 'PIN ungültig.' : 'Fehler.'}
        </section>
      )}

      <section className="grid sm:grid-cols-2 gap-4">
        <a href="/verbuchen" className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-900/70">
          <div className="text-sm text-zinc-400">Verbuchung</div>
          <div className="text-xl font-semibold">Getränke & Kisten</div>
        </a>
        <a href="/terminal" className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-900/70">
          <div className="text-sm text-zinc-400">Terminal</div>
          <div className="text-xl font-semibold">PIN-Login</div>
          <div className="text-xs text-zinc-500 mt-1">Für iPad/Tresen optimiert</div>
        </a>
      </section>
    </main>
  )
}
