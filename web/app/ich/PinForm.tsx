'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function PinForm(){
  const [pin, setPin] = useState('')
  const [msg, setMsg] = useState<string|null>(null)
  const [err, setErr] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)

  async function save(){
    setMsg(null); setErr(null); setLoading(true)
    try{
      if(!/^\d{4}$/.test(pin)) throw new Error('Bitte 4-stellige PIN (nur Ziffern)')
      const { error } = await supabase.auth.updateUser({ password: pin })
      if(error) throw error
      setMsg('PIN gespeichert ✔︎ (gilt als Passwort für das Terminal)')
      setPin('')
    }catch(e:any){
      setErr(e?.message ?? 'Fehler beim Speichern')
    }finally{ setLoading(false) }
  }

  return (
    <div className="card">
      <div className="text-lg font-semibold mb-2">PIN setzen / ändern</div>
      <div className="flex gap-2 items-center">
        <input
          type="password"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          value={pin}
          onChange={e=>setPin(e.target.value.replace(/\D/g,''))}
          placeholder="****"
          className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2 outline-none focus:border-[var(--primary)] w-32 text-center tracking-widest"
        />
        <button onClick={save} className="btn-primary" disabled={loading}>
          {loading ? 'Speichere…' : 'Speichern'}
        </button>
      </div>
      {msg && <div className="text-green-400 text-sm mt-2">{msg}</div>}
      {err && <div className="text-red-400 text-sm mt-2">{err}</div>}
      <div className="text-xs text-zinc-500 mt-2">
        Hinweis: Die PIN wird als <b>Passwort</b> genutzt. Terminal: E-Mail + PIN.
      </div>
    </div>
  )
}
