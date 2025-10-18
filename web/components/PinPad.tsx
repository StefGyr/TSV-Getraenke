'use client'

import { useState } from 'react'

export default function PinPad() {
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function add(d: string) {
    if (pin.length < 6) setPin(pin + d)
  }
  function del() { setPin(pin.slice(0, -1)) }
  function clear() { setPin('') }

  async function submit() {
    setBusy(true); setErr(null)
    try {
      const fd = new FormData()
      fd.set('pin', pin)
      const res = await fetch('/terminal/login', { method: 'POST', body: fd })
      if (!res.ok) {
        setErr('PIN ungültig oder Login fehlgeschlagen')
        return
      }
      // Route-Handler macht Redirect; wir aktualisieren die Seite:
      window.location.href = '/terminal'
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <input
        value={'•'.repeat(pin.length)}
        readOnly
        className="w-full text-center text-3xl font-mono px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800"
      />
      <div className="grid grid-cols-3 gap-2">
        {['1','2','3','4','5','6','7','8','9'].map(n => (
          <button key={n} onClick={() => add(n)}
            className="py-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">{n}</button>
        ))}
        <button onClick={del} className="py-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">⌫</button>
        <button onClick={() => add('0')} className="py-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">0</button>
        <button onClick={clear} className="py-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">C</button>
      </div>

      {err && <div className="text-sm text-red-400">{err}</div>}

      <button
        onClick={submit}
        disabled={busy || pin.length < 4}
        className="btn-primary w-full py-3 disabled:opacity-50"
      >
        {busy ? 'Anmelden…' : 'Anmelden'}
      </button>
    </div>
  )
}
