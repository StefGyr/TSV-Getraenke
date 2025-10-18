import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const sb = createSupabaseServer()
  const { data: { user } } = await (await sb).auth.getUser()
  if (!user) return new NextResponse('Nicht eingeloggt', { status: 401 })

  const fd = await req.formData()
  const pin = String(fd.get('pin') || '').trim()
  if (!/^\d{4,6}$/.test(pin)) return new NextResponse('PIN muss 4–6 Ziffern haben', { status: 400 })

  // Hinweis: Zum Start als Klartext speichern. Optional später via pgcrypto hashen.
  const { error } = await (await sb).from('profiles').update({ pin_hash: pin }).eq('id', user.id)
  if (error) return new NextResponse(error.message, { status: 400 })

  return NextResponse.json({ ok: true })
}
