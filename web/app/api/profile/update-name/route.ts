import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const sb = createSupabaseServer()
  const { data: { user } } = await (await sb).auth.getUser()
  if (!user) return new NextResponse('Nicht eingeloggt', { status: 401 })

  const fd = await req.formData()
  const full_name = String(fd.get('full_name') || '').trim()
  if (!full_name) return new NextResponse('Name fehlt', { status: 400 })

  const { error } = await (await sb).from('profiles').update({ full_name }).eq('id', user.id)
  if (error) return new NextResponse(error.message, { status: 400 })

  return NextResponse.json({ ok: true })
}
