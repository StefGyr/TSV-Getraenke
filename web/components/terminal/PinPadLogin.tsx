'use client'
import * as React from 'react'
import PinPad from './PinPad'

export default function PinPadLogin({ error }: { error: string | null }) {
  return (
    <PinPad
      title="PIN Eingabe"
      subtitle="Bitte 6-stellige PIN"
      error={error}
      onSubmit={async (pin) => {
        const fd = new FormData()
        fd.append('pin', pin)
        const res = await fetch('/terminal/login', { method: 'POST', body: fd })
        // Route-Handler macht Redirect → Browser folgt automatisch
        if (res.redirected) window.location.href = res.url
        else window.location.reload()
      }}
    />
  )
}
