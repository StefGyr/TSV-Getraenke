import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!URL || !KEY) {
  // Deutlichere Fehlermeldung im Server-Log
  console.error('Supabase ENV fehlt!', { URL, KEY: !!KEY })
  throw new Error('ENV fehlt: Bitte .env.local im Ordner "web/" anlegen und Dev-Server neu starten.')
}

export const supabase = createClient(URL, KEY)
