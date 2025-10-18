import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { pin } = await req.json()
  const p = String(pin || '').replace(/\D/g, '').slice(0, 6)
  if (p.length < 4) return NextResponse.json({ error: 'PIN zu kurz (min. 4 Ziffern)' }, { status: 400 })

  // RPC -> setzt pin_hash mit bcrypt (pgcrypto)
  const { error } = await sb.rpc('set_user_pin', { p_user: user.id, p_pin: p })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
