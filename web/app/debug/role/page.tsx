import { createSupabaseServer } from '@/lib/supabase-server'

export default async function DebugRolePage() {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()

  if (!user) {
    return (
      <main className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="text-red-400">Nicht eingeloggt</div>
      </main>
    )
  }

  const { data: me, error } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return (
    <main className="space-y-3 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
      <div><b>User:</b> {user.email}</div>
      <div><b>UID:</b> {user.id}</div>
      <div><b>Rolle (profiles.role):</b> {me?.role ?? '—'}</div>
      {error && <div className="text-red-400 text-sm">Fehler: {error.message}</div>}
      <a className="nav-link" href="/admin/produkte">→ Zu /admin/produkte</a>
    </main>
  )
}
