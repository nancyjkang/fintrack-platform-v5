'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/client/auth-context'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    tenantName: ''
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        name: formData.name || undefined,
        tenantName: formData.tenantName || undefined
      })

      if (result.success) {
        router.push('/dashboard')
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="card">
          <div className="card-body">
            {/* Header */}
            <div className="auth-header">
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">
                Start your financial journey with FinTrack
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <p className="error-text">{error}</p>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your email"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="tenantName" className="form-label">
                  Workspace Name
                </label>
                <input
                  id="tenantName"
                  name="tenantName"
                  type="text"
                  value={formData.tenantName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., John's Finances"
                  disabled={isSubmitting}
                />
                <p className="form-help">
                  This will be the name of your financial workspace
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Create a strong password"
                  required
                  disabled={isSubmitting}
                />
                <p className="form-help">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Confirm your password"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formData.email || !formData.password}
                className="btn btn-primary w-full"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner mr-2"></span>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="auth-footer">
              <p className="auth-link">
                Already have an account?{' '}
                <Link href="/auth/login">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
