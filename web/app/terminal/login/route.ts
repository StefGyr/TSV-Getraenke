import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase-server'

// Erwartet Body: { pin: "123456" }
// Prüft Profile über pin_hash == pin (einfacher Fallback, bis Hash/RPC aktiv ist)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const pin: string = typeof body.pin === 'string' ? body.pin.trim() : ''

    // 6-stellig erzwingen
    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.redirect(new URL('/terminal?err=bad_pin', req.url))
    }

    const sb = await createSupabaseServer()

    // Fallback-Login: pin_hash == eingetippter PIN
    // (Wenn du später Hash/RPC nutzt, tausche diese Query aus.)
    const { data: prof, error } = await sb
      .from('profiles')
      .select('id, full_name')
      .eq('pin_hash', pin)
      .single()

    if (error || !prof?.id) {
      return NextResponse.redirect(new URL('/terminal?err=bad_pin', req.url))
    }

    // Cookies setzen (reine Strings)
    const jar = cookies()
    jar.set('terminal_user_id', String(prof.id),   { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 30 })
    jar.set('terminal_user_name', String(prof.full_name || ''), { path: '/', sameSite: 'lax', maxAge: 60 * 30 })

    return NextResponse.redirect(new URL('/terminal?ok=login', req.url))
  } catch {
    return NextResponse.redirect(new URL('/terminal?err=server', req.url))
  }
}
