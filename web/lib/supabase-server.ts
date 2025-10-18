// web/lib/supabase-server.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function createSupabaseServer() {
  // Next 15: cookies() kann async sein → await!
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // In Server Components/Actions greifen wir Cookies NICHT direkt schreibend an:
        set() {},
        remove() {},
      },
    }
  )
}
