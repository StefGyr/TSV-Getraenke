import Link from 'next/link'
import { cookies } from 'next/headers'

export default async function TerminalPage({ searchParams }: { searchParams: Promise<Record<string,string>> }) {
  const jar = await cookies()
  const params = await searchParams
  const err = params?.err
  const ok  = params?.ok

  const userId = jar.get('terminal_user_id')?.value || ''
  const userName = jar.get('terminal_user_name')?.value || ''
  // ...
}
import PinPadLogin from '@/components/terminal/PinPadLogin'

export const dynamic = 'force-dynamic'

type SP = Record<string, string | undefined>

export default async function TerminalPage({
  searchParams,
}: {
  searchParams: Promise<SP>
}) {
  const sp = await searchParams
  const jar = await cookies()

  const terminalUserId = jar.get('terminal_user_id')?.value || ''
  const terminalUserName =
    decodeURIComponent(jar.get('terminal_user_name')?.value || '') || ''

  const err = sp?.err
  const ok = sp?.ok
  const msgErr =
    err === 'bad_pin'
      ? 'PIN ungültig. Bitte erneut versuchen.'
      : err === 'server'
      ? 'Serverfehler – bitte später erneut versuchen.'
      : null
  const msgOk = ok === 'login' ? 'Erfolgreich eingeloggt.' : null

  return (
    <main className="space-y-6">
      <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400">Terminal</div>
            <div className="text-xl font-semibold">TSV Herren · Getränke-Terminal</div>
          </div>
          <nav className="flex gap-2 text-sm">
            <Link href="/" className="btn btn-ghost">← Start</Link>
            <Link href="/verbuchen" className="btn btn-ghost">Verbuchung</Link>
            <Link href="/admin" className="btn btn-ghost">Admin</Link>
          </nav>
        </div>
      </section>

      {(msgErr || msgOk) && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          {msgErr && <div className="text-sm text-red-300">{msgErr}</div>}
          {msgOk && <div className="text-sm text-emerald-300">{msgOk}</div>}
        </section>
      )}

      {!terminalUserId ? (
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-sm font-semibold mb-2">PIN Login</div>
            <PinPadLogin error={msgErr} />
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-sm font-semibold mb-2">Hinweise</div>
            <ul className="text-sm text-zinc-300 list-disc list-inside space-y-1">
              <li>Nur PIN eingeben, keine E-Mail nötig.</li>
              <li>Danach eindeutig „Kostenpflichtig“ vs. „Freibier“ wählen.</li>
              <li>Nach Nutzung bitte wieder abmelden.</li>
            </ul>
          </div>
        </section>
      ) : (
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-sm text-zinc-400">Eingeloggt</div>
            <div className="text-xl font-semibold">Hallo {terminalUserName || 'Spieler'}</div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <a href="/verbuchen" className="btn btn-primary w-full">Kostenpflichtiges Getränk</a>
              <a href="/verbuchen#frei-bier" className="btn w-full border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25">
                Freibier nehmen
              </a>
              <a href="/verbuchen#kiste" className="btn w-full border border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
                Kiste ausgeben
              </a>
              <form action="/terminal/logout" method="post">
                <button className="btn btn-ghost w-full" type="submit">Abmelden</button>
              </form>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-sm font-semibold mb-2">Kurzinfo</div>
            <div className="text-sm text-zinc-300">
              (Hier kann Bestandsinfo / aktive Kisten etc. stehen – bauen wir als Nächstes aus.)
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
