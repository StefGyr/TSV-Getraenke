import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const jar = cookies()
  // sicher löschen
  jar.set('terminal_user_id', '', { path: '/', maxAge: 0 })
  jar.set('terminal_user_name', '', { path: '/', maxAge: 0 })

  return NextResponse.redirect(new URL('/terminal?ok=logout', req.url))
}
