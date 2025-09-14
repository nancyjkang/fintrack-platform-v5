/**
 * Client-side API utilities for FinTrack v5
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface User {
  id: string
  email: string
  emailVerified: boolean
  lastLogin?: Date
}

export interface Tenant {
  id: string
  name: string
  type: string
  role?: string
}

export interface AuthResponse {
  user: User
  tenant: Tenant
  tokens: AuthTokens
}

class ApiClient {
  private baseUrl: string
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl

    // Load tokens from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken')
      this.refreshToken = localStorage.getItem('refreshToken')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    // Add authorization header if we have an access token
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      })

      const data: ApiResponse<T> = await response.json()

      // If we get a 401 and have a refresh token, try to refresh
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken()
        if (refreshed) {
          // Retry the original request with new token
          headers.Authorization = `Bearer ${this.accessToken}`
          const retryResponse = await fetch(url, {
            ...options,
            headers
          })
          return retryResponse.json()
        }
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred',
        timestamp: new Date().toISOString()
      }
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      })

      const data: ApiResponse<{ tokens: AuthTokens }> = await response.json()

      if (data.success && data.data) {
        this.setTokens(data.data.tokens)
        return true
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
    }

    // If refresh fails, clear tokens
    this.clearTokens()
    return false
  }

  private setTokens(tokens: AuthTokens) {
    this.accessToken = tokens.accessToken
    this.refreshToken = tokens.refreshToken

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', tokens.accessToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)
    }
  }

  private clearTokens() {
    this.accessToken = null
    this.refreshToken = null

    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  // Authentication methods
  async register(data: {
    email: string
    password: string
    name?: string
    tenantName?: string
  }): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    })

    if (response.success && response.data) {
      this.setTokens(response.data.tokens)
    }

    return response
  }

  async login(data: {
    email: string
    password: string
  }): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    })

    if (response.success && response.data) {
      this.setTokens(response.data.tokens)
    }

    return response
  }

  async logout(): Promise<ApiResponse> {
    if (!this.refreshToken) {
      this.clearTokens()
      return { success: true, timestamp: new Date().toISOString() }
    }

    const response = await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken })
    })

    this.clearTokens()
    return response
  }

  // Account methods
  async getAccounts(): Promise<ApiResponse<{
    items: Array<{
      id: string
      name: string
      type: string
      subtype: string
      current_balance: number
      currency: string
      account_number_last4?: string
      institution_name?: string
      color: string
      icon: string
    }>
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }>> {
    return this.request('/accounts')
  }

  async createAccount(data: {
    name: string
    type: string
    subtype?: string
    initialBalance?: number
    currency: string
    accountNumberLast4?: string
    institutionName?: string
    color?: string
    icon?: string
  }): Promise<ApiResponse<any>> {
    return this.request('/accounts', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  getAccessToken(): string | null {
    return this.accessToken
  }
}

// Export a singleton instance
export const api = new ApiClient()

// Export the class for testing or multiple instances
export { ApiClient }
