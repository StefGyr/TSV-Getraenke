import { createSupabaseServer } from '@/lib/supabase-server'
import ClientBox from './ClientBox'

export default async function DebugAuthPage() {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()

  return (
    <main className="space-y-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
      <div><b>Server user:</b></div>
      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
        {user ? JSON.stringify({ id: user.id, email: user.email }, null, 2) : 'null'}
      </div>

      <ClientBox />

      <a className="nav-link" href="/">← Start</a>
    </main>
  )
}
