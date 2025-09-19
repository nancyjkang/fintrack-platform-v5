/**
 * Client-side API utilities for FinTrack v5
 */
import { getCurrentDate, toUTCDateString } from '@/lib/utils/date-utils'

export interface ApiResponse<T = unknown> {
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
  lastLogin?: string
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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
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
    } catch {
      return {
        success: false,
        error: 'Network error occurred',
        timestamp: toUTCDateString(getCurrentDate())
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
      return { success: true, timestamp: toUTCDateString(getCurrentDate()) }
    }

    const response = await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken })
    })

    this.clearTokens()
    return response
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User; tenant: Tenant }>> {
    return this.request<{ user: User; tenant: Tenant }>('/auth/me')
  }

  // Account methods
  async getAccounts(filters?: {
    type?: string
    is_active?: boolean
    search?: string
  }): Promise<ApiResponse<Array<{
    id: number
    tenant_id: string
    name: string
    type: string
    net_worth_category: string
    balance: number
    balance_date: string
    color: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>>> {
    const params = new URLSearchParams()
    if (filters?.type) params.append('type', filters.type)
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString())
    if (filters?.search) params.append('search', filters.search)

    const queryString = params.toString()
    return this.request(`/accounts${queryString ? `?${queryString}` : ''}`)
  }

  async getAccount(id: number): Promise<ApiResponse<{
    id: number
    tenant_id: string
    name: string
    type: string
    net_worth_category: string
    balance: number
    balance_date: string
    color: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>> {
    return this.request(`/accounts/${id}`)
  }

  async createAccount(data: {
    name: string
    type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'LOAN' | 'TRADITIONAL_RETIREMENT' | 'ROTH_RETIREMENT'
    net_worth_category?: 'ASSET' | 'LIABILITY' | 'EXCLUDED'
    balance: number
    balance_date: string // YYYY-MM-DD format
    color: string
    is_active?: boolean
  }): Promise<ApiResponse<unknown>> {
    return this.request('/accounts', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateAccount(id: number, data: {
    name?: string
    type?: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'LOAN' | 'TRADITIONAL_RETIREMENT' | 'ROTH_RETIREMENT'
    net_worth_category?: 'ASSET' | 'LIABILITY' | 'EXCLUDED'
    balance?: number
    balance_date?: string // YYYY-MM-DD format
    color?: string
    is_active?: boolean
  }): Promise<ApiResponse<unknown>> {
    return this.request(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteAccount(id: number): Promise<ApiResponse<unknown>> {
    return this.request(`/accounts/${id}`, {
      method: 'DELETE'
    })
  }

  async reconcileAccount(id: number, data: {
    newBalance: number
    reconcileDate: string // YYYY-MM-DD format
  }): Promise<ApiResponse<{
    account: unknown
    adjustmentTransaction?: unknown
    message: string
  }>> {
    return this.request(`/accounts/${id}/reconcile`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getNetWorth(): Promise<ApiResponse<{
    netWorth: number
    breakdown: {
      totalAssets: number
      totalLiabilities: number
      excludedAccounts: number
    }
    accountCounts: {
      assets: number
      liabilities: number
      excluded: number
      total: number
    }
  }>> {
    return this.request('/accounts/net-worth')
  }

  // Transaction methods
  async getTransactions(params?: {
    search?: string
    account_id?: string
    type?: string
    category_id?: string
    is_recurring?: string
    date_from?: string
    date_to?: string
  }): Promise<ApiResponse<{
    transactions: Array<{
      id: number
      account_id: number
      category_id?: number
      amount: number
      description: string
      date: string
      type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
      is_recurring: boolean
      created_at: string
      updated_at: string
      tenant_id: number
      account?: {
        id: number
        name: string
        type: string
        color?: string
      }
      category?: {
        id: number
        name: string
        type: string
        color?: string
      }
    }>
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }>> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })
    }
    const url = `/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(url)
  }

  async createTransaction(data: {
    account_id: number
    category_id?: number
    amount: number
    description: string
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
    date: string
    is_recurring: boolean
  }): Promise<ApiResponse<unknown>> {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateTransaction(id: number, data: {
    account_id?: number
    category_id?: number
    amount?: number
    description?: string
    type?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
    date?: string
    is_recurring?: boolean
  }): Promise<ApiResponse<unknown>> {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteTransaction(id: number): Promise<ApiResponse<unknown>> {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE'
    })
  }

  async bulkUpdateTransactions(transactionIds: number[], updates: {
    category_id?: number | null
    account_id?: number
    amount?: string
    description?: string
    type?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
    is_recurring?: boolean
    date?: string
  }): Promise<ApiResponse<{ message: string; updatedCount: number; updatedAt: string }>> {
    return this.request('/transactions/bulk', {
      method: 'PATCH',
      body: JSON.stringify({
        transactionIds,
        updates
      })
    });
  }

  async bulkDeleteTransactions(transactionIds: number[]): Promise<ApiResponse<{ message: string; deletedCount: number; deletedAt: string }>> {
    return this.request('/transactions/bulk', {
      method: 'DELETE',
      body: JSON.stringify({
        transactionIds
      })
    })
  }

  async getCategories(params?: {
    type?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
    search?: string
  }): Promise<ApiResponse<{
    categories: Array<{
      id: number
      name: string
      type: string
      color: string
      tenant_id: string
      created_at: string
      updated_at: string
    }>
    count: number
  }>> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })
    }
    const url = `/categories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(url)
  }

  async getCategoryById(id: number): Promise<ApiResponse<{
    category: {
      id: number
      name: string
      type: string
      color: string
      tenant_id: string
      created_at: string
      updated_at: string
    }
  }>> {
    return this.request(`/categories/${id}`)
  }

  async createCategory(data: {
    name: string
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
    color: string
  }): Promise<ApiResponse<{
    category: {
      id: number
      name: string
      type: string
      color: string
      tenant_id: string
      created_at: string
      updated_at: string
    }
  }>> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateCategory(id: number, data: {
    name?: string
    type?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
    color?: string
  }): Promise<ApiResponse<{
    category: {
      id: number
      name: string
      type: string
      color: string
      tenant_id: string
      created_at: string
      updated_at: string
    }
  }>> {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteCategory(id: number): Promise<ApiResponse<unknown>> {
    return this.request(`/categories/${id}`, {
      method: 'DELETE'
    })
  }

  async mergeCategories(sourceCategoryId: number, targetCategoryId: number): Promise<ApiResponse<{
    transactionsUpdated: number
    sourceCategoryDeleted: boolean
  }>> {
    return this.request('/categories/merge', {
      method: 'POST',
      body: JSON.stringify({
        sourceCategoryId,
        targetCategoryId
      })
    })
  }

  async getCategoryUsageStats(categoryIds?: number[]): Promise<ApiResponse<{
    usageStats: Array<{
      categoryId: number
      transactionCount: number
    }>
    count: number
  }>> {
    const queryParams = new URLSearchParams()
    if (categoryIds && categoryIds.length > 0) {
      queryParams.append('categoryIds', categoryIds.join(','))
    }
    const url = `/categories/usage${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(url)
  }

  // Financial Cube methods
  async populateCube(data: {
    startDate?: string // YYYY-MM-DD format
    endDate?: string // YYYY-MM-DD format
    clearExisting?: boolean
    batchSize?: number
    accountId?: number // Optional: populate only for specific account
  } = {}): Promise<ApiResponse<{
    periodsProcessed: number
    recordsCreated: number
    timeElapsed: number
    timeElapsedFormatted: string
    accountsProcessed?: number
  }>> {
    return this.request('/cube/populate', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getCubeStats(): Promise<ApiResponse<{
    totalRecords: number
    weeklyRecords: number
    monthlyRecords: number
    dateRange: {
      earliest: string | null
      latest: string | null
    }
    lastUpdated: string | null
  }>> {
    return this.request('/cube/populate')
  }

  async getCubeTrends(filters: {
    periodType?: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BI_ANNUALLY' | 'ANNUALLY'
    startDate?: string // YYYY-MM-DD format
    endDate?: string // YYYY-MM-DD format
    transactionType?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
    categoryIds?: number[] | string
    accountIds?: number[] | string
    isRecurring?: boolean
  } = {}): Promise<ApiResponse<Array<{
    period_start: string
    period_type: string
    transaction_type: string
    category_name: string
    account_name: string
    is_recurring: boolean
    total_amount: number
    transaction_count: number
  }>>> {
    const params = new URLSearchParams()
    if (filters.periodType) params.append('periodType', filters.periodType)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.transactionType) params.append('transactionType', filters.transactionType)
    if (filters.categoryIds?.length) {
      const categoryIds = Array.isArray(filters.categoryIds) ? filters.categoryIds.join(',') : filters.categoryIds
      params.append('categoryIds', categoryIds)
    }
    if (filters.accountIds?.length) {
      const accountIds = Array.isArray(filters.accountIds) ? filters.accountIds.join(',') : filters.accountIds
      params.append('accountIds', accountIds)
    }
    if (filters.isRecurring !== undefined) params.append('isRecurring', filters.isRecurring.toString())

    const queryString = params.toString()
    return this.request(`/trends${queryString ? `?${queryString}` : ''}`)
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
