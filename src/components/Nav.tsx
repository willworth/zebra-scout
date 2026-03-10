// sites/zebra-scout/src/components/Nav.tsx

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Nav() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/symptoms', label: 'Check Symptoms' },
    { href: '/about', label: 'About' },
  ]

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">🦓</span>
          <span>Zebra Scout</span>
        </Link>
        <div className="flex gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-purple-700 ${
                pathname === link.href
                  ? 'font-semibold text-purple-700'
                  : 'text-gray-600'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
