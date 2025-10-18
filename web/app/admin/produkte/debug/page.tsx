// web/app/admin/produkte/debug/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'

/* ---- Admin-Guard ---- */
async function ensureAdmin() {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Nicht eingeloggt')
  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') throw new Error('Nur Admin')
  return { sb, user }
}

/* ---- Probe-Insert: Getränk + Preis ---- */
export async function probeAction() {
  'use server'
  try {
    const { sb } = await ensureAdmin()
    const { data: d, error } = await sb
      .from('drinks')
      .insert({ name: 'Probe ' + Date.now(), unit: 'Flasche', segments_per_crate: 20, is_active: true })
      .select('id')
      .single()
    if (error) throw error

    const { error: pe } = await sb.from('prices').insert({ drink_id: d!.id, price_cents: 123 })
    if (pe) throw pe

    redirect('/admin/produkte/debug?status=ok')
  } catch (e: any) {
    const msg = encodeURIComponent(e?.message ?? 'Unbekannter Fehler')
    redirect('/admin/produkte/debug?err=' + msg)
  }
}

export default async function DebugPage({
  searchParams,
}: {
  searchParams: { status?: string; err?: string }
}) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  const roleRes = user
    ? await sb.from('profiles').select('role').eq('id', user.id).single()
    : null

  return (
    <main className="space-y-6">
      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-2xl">Produkte · Debug</div>
          <Link className="btn-ghost" href="/admin/produkte">← Zurück</Link>
        </div>

        <div className="grid gap-2 text-sm">
          <div><b>User:</b> {user?.email ?? '—'}</div>
          <div><b>User ID:</b> {user?.id ?? '—'}</div>
          <div><b>Rolle:</b> {roleRes?.data?.role ?? '—'}</div>
          {searchParams?.status === 'ok' && (
            <div className="text-green-400">Probe-Insert: OK ✅</div>
          )}
          {searchParams?.err && (
            <div className="text-red-400">Fehler: {decodeURIComponent(searchParams.err)}</div>
          )}
        </div>

        <form action={probeAction} className="mt-4">
          <button className="btn-primary" type="submit">Probe-Insert ausführen</button>
        </form>
      </section>
    </main>
  )
}
