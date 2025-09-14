import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/client/auth-context'
import './globals.css'

export const metadata: Metadata = {
  title: 'FinTrack v5 - Privacy-First Personal Finance',
  description: 'Secure, multi-tenant personal finance management with advanced analytics and benchmarking.',
  keywords: ['finance', 'budgeting', 'expenses', 'privacy', 'personal finance'],
  authors: [{ name: 'FinTrack Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
