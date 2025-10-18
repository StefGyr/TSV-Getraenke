import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const id = body.id as string | undefined
  const note = (body.note as string | undefined) ?? null
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })

  const { error } = await sb.rpc('approve_crate_request', { p_request_id: id, p_approve: true, p_note: note })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
