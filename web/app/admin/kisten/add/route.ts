import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

function base(req: Request) {
  const p = req.headers.get('x-forwarded-proto') ?? 'https'
  const h = req.headers.get('x-forwarded-host') ?? new URL(req.url).host
  return `${p}://${h}`
}

export async function POST(req: Request) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Nur Admin' }, { status: 403 })

  const fd = await req.formData()
  const drinkId = String(fd.get('drinkId') ?? '')
  const segments = Math.max(1, parseInt(String(fd.get('segments') ?? '20'), 10))
  if (!drinkId) return NextResponse.json({ error: 'drinkId fehlt' }, { status: 400 })

  const { error } = await sb.from('crates').insert({
    drink_id: drinkId,
    total_segments: segments,
    remaining_segments: segments,
    created_by: user.id,
    is_active: true,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.redirect(`${base(req)}/admin/kisten`, { status: 303 })
}
