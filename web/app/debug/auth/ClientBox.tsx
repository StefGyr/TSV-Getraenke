'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'

export default function ClientBox() {
  const [txt, setTxt] = useState('lade…')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const s = await supabase.auth.getSession()
      if (!mounted) return
      // WICHTIG: null als 2. Param für replacer, 2 als space
      setTxt(JSON.stringify(s.data.session?.user ?? null, null, 2))
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 whitespace-pre-wrap text-xs">
      <b>Client user:</b>{'\n'}{txt}
    </div>
  )
}
