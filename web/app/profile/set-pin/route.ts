// web/app/profile/set-pin/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

function base(req: Request) {
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host  = req.headers.get('x-forwarded-host')  ?? new URL(req.url).host
  return `${proto}://${host}`
}

export async function POST(req: Request) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.redirect(`${base(req)}/login-passwort`, { status: 303 })

  const fd = await req.formData()
  const pin = String(fd.get('pin') ?? '').replace(/\D+/g, '')
  if (pin.length < 4 || pin.length > 6) {
    return NextResponse.json({ error: 'PIN 4–6 Ziffern' }, { status: 400 })
  }

  const { error } = await sb.rpc('set_pin', { p_pin: pin })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.redirect(`${base(req)}/ich`, { status: 303 })
}
