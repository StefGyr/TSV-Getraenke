'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const items = [
  { href: '/', label: 'Start' },
  { href: '/verbuchen', label: 'Verbuchung' },
  { href: '/ich', label: 'Ich' },
  { href: '/terminal', label: 'Terminal' },
  { href: '/admin', label: 'Admin' },
  { href: '/admin/produkte', label: 'Produkte' },
  { href: '/admin/zahlungen', label: 'Zahlungen' },
  { href: '/admin/kisten', label: 'Kisten' },
  { href: '/admin/tagesuebersicht', label: 'Tagesübersicht' },
]

export default function Nav() {
  const pathname = usePathname() || '/'
  return (
    <nav className="tabs">
      {items.map(it => {
        const active =
          pathname === it.href ||
          (it.href !== '/' && pathname.startsWith(it.href))
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`tab ${active ? 'tab--active' : ''}`}
          >
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
