'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

type Tab = { href: string; label: string }

const TABS: Tab[] = [
  { href: '/admin',               label: 'Dashboard' },
  { href: '/admin/produkte',      label: 'Produkte' },
  { href: '/admin/bestand',       label: 'Bestand' },
  { href: '/admin/zahlungen',     label: 'Zahlungen' },
  { href: '/admin/tagesuebersicht', label: 'Tagesübersicht' },
  { href: '/admin/salden',        label: 'Salden' },
]

export default function AdminTabs() {
  const pathname = usePathname()
  return (
    <nav className="flex flex-wrap gap-2">
      {TABS.map((t) => {
        const active = pathname === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            className={[
              'px-3 py-1.5 rounded-xl text-sm border transition',
              active
                ? 'bg-[var(--primary)]/20 border-[var(--primary)]/50 text-white'
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800/70',
            ].join(' ')}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
