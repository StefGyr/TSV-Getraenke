// web/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  // WICHTIG: keine request.headers an NextResponse.next() übergeben!
  const res = NextResponse.next()

  // Cookie-Bridge für Supabase (liest/schreibt Cookies auf req/res)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          req.cookies.set(name, value)
          res.cookies.set({ name, value, ...options })
        },
        remove: (name, options) => {
          req.cookies.delete(name)
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // triggert ggf. Session-Refresh (setzt Set-Cookie in res)
  await supabase.auth.getUser()

  return res
}

// Global anwenden (Server Actions funktionieren nur störungsfrei, wenn wir / vollständig matchen)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
