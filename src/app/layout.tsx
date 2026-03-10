// sites/zebra-scout/src/app/layout.tsx

import type { Metadata } from 'next'
import './globals.css'
import { Disclaimer } from '@/components/Disclaimer'
import { Nav } from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Zebra Scout — Rare Disease Symptom Checker',
  description:
    'Enter symptoms and get a ranked list of possible rare conditions to discuss with your doctor. Not a diagnosis — a better conversation starter.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Nav />
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
        <Disclaimer />
      </body>
    </html>
  )
}
