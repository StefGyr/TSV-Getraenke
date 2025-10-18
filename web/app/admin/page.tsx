import { createSupabaseServer } from '@/lib/supabase-server'
import AdminTabs from '@/components/admin/AdminTabs'

export const revalidate = 0

export default async function AdminPage() {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) {
    return (
      <main className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        Bitte einloggen · <a className="underline" href="/login?next=/admin">Login</a>
      </main>
    )
  }
  const { data: me } = await sb.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (me?.role !== 'admin') {
    return <main className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">Nicht berechtigt.</main>
  }

  return (
    <main className="space-y-6">
      <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="text-xs text-zinc-400">Admin</div>
        <div className="text-xl font-semibold">Dashboard</div>

        <div className="mt-4">
          <AdminTabs />
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-sm text-zinc-400 mb-1">Kurzübersicht</div>
          <div className="text-zinc-300 text-sm">
            • Produkte pflegen<br/>
            • Bestand prüfen & Kisten ausgeben<br/>
            • Zahlungen verifizieren<br/>
            • Tagesübersicht & Salden ansehen
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-sm text-zinc-400 mb-1">Nächste Schritte</div>
          <div className="text-zinc-300 text-sm">
            • Bestand (DB + UI) finalisieren<br/>
            • CSV-Exporte<br/>
            • Rechte/Policies feinjustieren
          </div>
        </div>
      </section>
    </main>
  )
}
