'use client'

import { useAuth } from '@/lib/client/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Navigation from '@/components/layout/Navigation'
import { AccountsPageContent } from '@/components/accounts/AccountsPageContent'

export default function AccountsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AccountsPageContent />
        </div>
      </main>
    </div>
  )
}
