'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/customers', label: 'Customers' },
    { href: '/items', label: 'Items' },
    { href: '/invoices', label: 'Invoices' },
  ]

  return (
    <nav className="border-b bg-background">
      <div className="flex h-16 items-center px-8">
        <Link key="/" href="/" className="mr-8 font-bold text-xl">EdiSejahtera</Link>
        <div className="flex items-center space-x-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === link.href
                  ? 'text-black dark:text-white'
                  : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
