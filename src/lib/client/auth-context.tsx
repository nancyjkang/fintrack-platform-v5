'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, type User, type Tenant } from './api'

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: {
    email: string
    password: string
    name?: string
    tenantName?: string
  }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user && api.isAuthenticated()

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (api.isAuthenticated()) {
        // Try to fetch user data to verify token is still valid
        try {
          const response = await api.getAccounts()
          if (response.success) {
            // Token is valid, but we need user data
            // For now, we'll assume the user is authenticated
            // In a real app, you'd have a /me endpoint
            setUser({
              id: 'current-user',
              email: 'user@example.com',
              emailVerified: true
            })
            setTenant({
              id: 'current-tenant',
              name: 'User Finances',
              type: 'PERSONAL'
            })
          } else {
            // Token is invalid, clear it
            await api.logout()
          }
        } catch (error) {
          // Network error or token invalid
          console.log('Auth check failed:', error)
          await api.logout()
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await api.login({ email, password })

      if (response.success && response.data) {
        setUser(response.data.user)
        setTenant(response.data.tenant)
        return { success: true }
      } else {
        return { success: false, error: response.error || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: {
    email: string
    password: string
    name?: string
    tenantName?: string
  }) => {
    setIsLoading(true)
    try {
      const response = await api.register(data)

      if (response.success && response.data) {
        setUser(response.data.user)
        setTenant(response.data.tenant)
        return { success: true }
      } else {
        return { success: false, error: response.error || 'Registration failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await api.logout()
    } finally {
      setUser(null)
      setTenant(null)
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
