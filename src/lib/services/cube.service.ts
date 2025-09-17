import { BaseService } from './base.service'
import type { FinancialCube, Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, format } from 'date-fns'
import { getCurrentUTCDate, createUTCDate, addDays, toUTCMidnight } from '@/lib/utils/date-utils'

// Core interfaces for cube operations

/**
 * Financial Trends Cube Service
 *
 * Manages the dimensional data cube for financial trends analysis.
 * Provides high-performance aggregated data for OLAP-style queries.
 */
export class CubeService extends BaseService {
  protected get prisma() {
    return CubeService.prisma
  }

  /**
   * Rebuild cube data for a specific tenant and date range
   * This is the core method that aggregates transaction data into the cube
   */
  async rebuildCubeForPeriod(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    periodType: 'WEEKLY' | 'MONTHLY' = 'MONTHLY',
    accountId?: number // Optional: rebuild only for specific account
  ): Promise<void> {
    // Clear existing cube data for the period (optionally filtered by account)
    await this.clearCubeForPeriod(tenantId, startDate, endDate, periodType, accountId)

    // Generate periods between start and end dates
    const periods = this.generatePeriods(startDate, endDate, periodType)

    // Process each period
    for (const period of periods) {
      await this.buildCubeForSinglePeriod(tenantId, period.start, period.end, periodType, accountId)
    }
  }

  /**
   * Build cube data for a single time period
   */
  private async buildCubeForSinglePeriod(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
    periodType: 'WEEKLY' | 'MONTHLY',
    accountId?: number // Optional: build only for specific account
  ): Promise<void> {
    // Aggregate transaction data for this period
    const aggregations = await this.prisma.$queryRaw<Array<{
      transaction_type: string
      category_id: number | null
      category_name: string
      account_id: number
      account_name: string
      is_recurring: boolean
      total_amount: Decimal
      transaction_count: bigint
    }>>`
      SELECT
        t.type as transaction_type,
        t.category_id,
        COALESCE(MIN(c.name), 'Uncategorized') as category_name,
        t.account_id,
        MIN(a.name) as account_name,
        t.is_recurring,
        SUM(t.amount) as total_amount,
        COUNT(*) as transaction_count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      INNER JOIN accounts a ON t.account_id = a.id
      WHERE t.tenant_id = ${tenantId}
        AND t.date >= ${periodStart}
        AND t.date <= ${periodEnd}
        ${accountId ? `AND t.account_id = ${accountId}` : ''}
      GROUP BY
        t.type,
        t.category_id,
        t.account_id,
        t.is_recurring
      HAVING COUNT(*) > 0
    `

    // Insert aggregated data into cube
    const cubeRecords: Prisma.FinancialCubeCreateManyInput[] = aggregations.map(agg => ({
      tenant_id: tenantId,
      period_type: periodType,
      period_start: periodStart,
      period_end: periodEnd,
      transaction_type: agg.transaction_type,
      category_id: agg.category_id,
      category_name: agg.category_name,
      account_id: agg.account_id,
      account_name: agg.account_name,
      is_recurring: agg.is_recurring,
      total_amount: agg.total_amount,
      transaction_count: Number(agg.transaction_count)
    }))

    if (cubeRecords.length > 0) {
      await this.prisma.financialCube.createMany({
        data: cubeRecords,
        skipDuplicates: true // Handle race conditions gracefully
      })
    }
  }

  /**
   * Populate cube with historical transaction data for a tenant
   * This is typically run once during initial setup or data migration
   */
  async populateHistoricalData(
    tenantId: string,
    options: {
      startDate?: Date
      endDate?: Date
      clearExisting?: boolean
      batchSize?: number
      accountId?: number // Optional: populate only for specific account
    } = {}
  ): Promise<{
    periodsProcessed: number
    recordsCreated: number
    timeElapsed: number
    accountsProcessed?: number
  }> {
    const startTime = performance.now()

    // Default options
    const {
      startDate = await this.getEarliestTransactionDate(tenantId, options.accountId),
      endDate = getCurrentUTCDate(),
      clearExisting = false,
      batchSize = 100,
      accountId
    } = options

    if (!startDate) {
      return {
        periodsProcessed: 0,
        recordsCreated: 0,
        timeElapsed: performance.now() - startTime,
        accountsProcessed: 0
      }
    }

    // Clear existing cube data if requested
    if (clearExisting) {
      const deleteWhere: any = { tenant_id: tenantId }
      if (accountId) {
        deleteWhere.account_id = accountId
      }

      await this.prisma.financialCube.deleteMany({
        where: deleteWhere
      })
    }

    // Generate all periods to process
    const weeklyPeriods = this.generatePeriods(startDate, endDate, 'WEEKLY')
    const monthlyPeriods = this.generatePeriods(startDate, endDate, 'MONTHLY')
    const allPeriods = [
      ...weeklyPeriods.map(p => ({ ...p, type: 'WEEKLY' as const })),
      ...monthlyPeriods.map(p => ({ ...p, type: 'MONTHLY' as const }))
    ]

    let periodsProcessed = 0
    let totalRecordsCreated = 0

    // Process periods in batches to avoid memory issues
    for (let i = 0; i < allPeriods.length; i += batchSize) {
      const batch = allPeriods.slice(i, i + batchSize)

      // Process each period in the batch
      for (const period of batch) {
        try {
          const recordsBefore = await this.getCubeRecordCount(
            tenantId,
            period.type,
            period.start,
            period.end,
            accountId
          )

          await this.rebuildCubeForPeriod(
            tenantId,
            period.start,
            period.end,
            period.type,
            accountId // Pass accountId for targeted rebuilding
          )

          const recordsAfter = await this.getCubeRecordCount(
            tenantId,
            period.type,
            period.start,
            period.end,
            accountId
          )
          totalRecordsCreated += (recordsAfter - recordsBefore)
          periodsProcessed++

        } catch (error) {
          console.error(`Error processing period ${period.start.toISOString()} - ${period.end.toISOString()}:`, error)
          // Continue with next period rather than failing entire operation
        }
      }

      // Small delay between batches to prevent overwhelming the database
      if (i + batchSize < allPeriods.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return {
      periodsProcessed,
      recordsCreated: totalRecordsCreated,
      timeElapsed: performance.now() - startTime,
      accountsProcessed: accountId ? 1 : await this.getAccountCount(tenantId)
    }
  }


  /**
   * Get financial trends data with flexible filtering
   */
  async getTrends(
    tenantId: string,
    filters: {
      periodType?: 'WEEKLY' | 'MONTHLY'
      startDate?: Date
      endDate?: Date
      transactionType?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
      categoryIds?: number[]
      accountIds?: number[]
      isRecurring?: boolean
    } = {}
  ): Promise<FinancialCube[]> {
    const where: Prisma.FinancialCubeWhereInput = {
      tenant_id: tenantId,
      ...(filters.periodType && { period_type: filters.periodType }),
      ...(filters.startDate && { period_start: { gte: filters.startDate } }),
      ...(filters.endDate && { period_start: { lte: filters.endDate } }),
      ...(filters.transactionType && { transaction_type: filters.transactionType }),
      ...(filters.categoryIds && { category_id: { in: filters.categoryIds } }),
      ...(filters.accountIds && { account_id: { in: filters.accountIds } }),
      ...(filters.isRecurring !== undefined && { is_recurring: filters.isRecurring })
    }

    return this.prisma.financialCube.findMany({
      where,
      orderBy: [
        { period_start: 'asc' },
        { transaction_type: 'asc' },
        { category_name: 'asc' },
        { account_name: 'asc' }
      ]
    })
  }

  /**
   * Get aggregated totals across multiple dimensions
   */
  async getAggregatedTotals(
    tenantId: string,
    groupBy: Array<'period_start' | 'transaction_type' | 'category_name' | 'account_name' | 'is_recurring'>,
    filters: {
      periodType?: 'WEEKLY' | 'MONTHLY'
      startDate?: Date
      endDate?: Date
      transactionType?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
      categoryIds?: number[]
      accountIds?: number[]
      isRecurring?: boolean
    } = {}
  ): Promise<Array<{
    [key: string]: any
    total_amount: Decimal
    transaction_count: number
  }>> {
    // Build dynamic GROUP BY clause
    const groupByClause = groupBy.join(', ')
    const selectClause = groupBy.join(', ') + ', SUM(total_amount) as total_amount, SUM(transaction_count) as transaction_count'

    // Build WHERE conditions
    const conditions: string[] = [`tenant_id = '${tenantId}'`]

    if (filters.periodType) conditions.push(`period_type = '${filters.periodType}'`)
    if (filters.startDate) conditions.push(`period_start >= '${format(filters.startDate, 'yyyy-MM-dd')}'`)
    if (filters.endDate) conditions.push(`period_start <= '${format(filters.endDate, 'yyyy-MM-dd')}'`)
    if (filters.transactionType) conditions.push(`transaction_type = '${filters.transactionType}'`)
    if (filters.categoryIds?.length) conditions.push(`category_id IN (${filters.categoryIds.join(',')})`)
    if (filters.accountIds?.length) conditions.push(`account_id IN (${filters.accountIds.join(',')})`)
    if (filters.isRecurring !== undefined) conditions.push(`is_recurring = ${filters.isRecurring}`)

    const whereClause = conditions.join(' AND ')

    // Execute dynamic query
    const results = await this.prisma.$queryRawUnsafe<Array<{
      [key: string]: any
      total_amount: Decimal
      transaction_count: bigint
    }>>(`
      SELECT ${selectClause}
      FROM financial_cube
      WHERE ${whereClause}
      GROUP BY ${groupByClause}
      ORDER BY ${groupBy[0]} ASC
    `)

    // Convert bigint to number for transaction_count
    return results.map(result => ({
      ...result,
      transaction_count: Number(result.transaction_count)
    }))
  }

  /**
   * Get spending trends by category over time
   */
  async getCategoryTrends(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    periodType: 'WEEKLY' | 'MONTHLY' = 'MONTHLY'
  ): Promise<Array<{
    period_start: Date
    category_name: string
    total_amount: Decimal
    transaction_count: number
  }>> {
    const results = await this.getAggregatedTotals(
      tenantId,
      ['period_start', 'category_name'],
      {
        periodType,
        startDate,
        endDate,
        transactionType: 'EXPENSE' // Focus on spending
      }
    )

    return results as Array<{
      period_start: Date
      category_name: string
      total_amount: Decimal
      transaction_count: number
    }>
  }

  /**
   * Get account balance trends over time
   */
  async getAccountTrends(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    periodType: 'WEEKLY' | 'MONTHLY' = 'MONTHLY'
  ): Promise<Array<{
    period_start: Date
    account_name: string
    total_amount: Decimal
    transaction_count: number
  }>> {
    const results = await this.getAggregatedTotals(
      tenantId,
      ['period_start', 'account_name'],
      {
        periodType,
        startDate,
        endDate
      }
    )

    return results as Array<{
      period_start: Date
      account_name: string
      total_amount: Decimal
      transaction_count: number
    }>
  }

  /**
   * Get income vs expense trends
   */
  async getIncomeExpenseTrends(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    periodType: 'WEEKLY' | 'MONTHLY' = 'MONTHLY'
  ): Promise<Array<{
    period_start: Date
    transaction_type: string
    total_amount: Decimal
    transaction_count: number
  }>> {
    const results = await this.getAggregatedTotals(
      tenantId,
      ['period_start', 'transaction_type'],
      {
        periodType,
        startDate,
        endDate
      }
    )

    return results as Array<{
      period_start: Date
      transaction_type: string
      total_amount: Decimal
      transaction_count: number
    }>
  }

  // Private helper methods

  private async clearCubeForPeriod(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    periodType: 'WEEKLY' | 'MONTHLY',
    accountId?: number // Optional: clear only for specific account
  ): Promise<void> {
    const whereClause: any = {
      tenant_id: tenantId,
      period_type: periodType,
      period_start: {
        gte: startDate,
        lte: endDate
      }
    }

    if (accountId) {
      whereClause.account_id = accountId
    }

    await this.prisma.financialCube.deleteMany({
      where: whereClause
    })
  }

  private generatePeriods(
    startDate: Date,
    endDate: Date,
    periodType: 'WEEKLY' | 'MONTHLY'
  ): Array<{ start: Date; end: Date }> {
    const periods: Array<{ start: Date; end: Date }> = []
    let current = toUTCMidnight(startDate) // Copy the date to avoid mutation

    while (current <= endDate) {
      let periodStart: Date
      let periodEnd: Date

      if (periodType === 'WEEKLY') {
        periodStart = startOfWeek(current, { weekStartsOn: 1 }) // Monday start
        periodEnd = endOfWeek(current, { weekStartsOn: 1 })
        current = addDays(periodEnd, 1) // Next day
      } else {
        periodStart = startOfMonth(current)
        periodEnd = endOfMonth(current)
        current = addDays(periodEnd, 1) // Next day
      }

      periods.push({ start: periodStart, end: periodEnd })
    }

    return periods
  }

  private async getAffectedPeriods(
    tenantId: string,
    transactionIds: number[]
  ): Promise<Array<{
    periodStart: Date
    periodEnd: Date
    periodType: 'WEEKLY' | 'MONTHLY'
  }>> {
    // Get distinct dates from affected transactions
    const transactions = await this.prisma.transaction.findMany({
      where: {
        tenant_id: tenantId,
        id: { in: transactionIds }
      },
      select: { date: true },
      distinct: ['date']
    })

    const affectedPeriods: Array<{
      periodStart: Date
      periodEnd: Date
      periodType: 'WEEKLY' | 'MONTHLY'
    }> = []

    // Generate both weekly and monthly periods for each affected date
    for (const transaction of transactions) {
      const date = transaction.date

      // Weekly period
      affectedPeriods.push({
        periodStart: startOfWeek(date, { weekStartsOn: 1 }),
        periodEnd: endOfWeek(date, { weekStartsOn: 1 }),
        periodType: 'WEEKLY'
      })

      // Monthly period
      affectedPeriods.push({
        periodStart: startOfMonth(date),
        periodEnd: endOfMonth(date),
        periodType: 'MONTHLY'
      })
    }

    // Remove duplicates
    const uniquePeriods = affectedPeriods.filter((period, index, self) =>
      index === self.findIndex(p =>
        p.periodStart.getTime() === period.periodStart.getTime() &&
        p.periodEnd.getTime() === period.periodEnd.getTime() &&
        p.periodType === period.periodType
      )
    )

    return uniquePeriods
  }

  /**
   * Get affected account IDs for a specific period from given transaction IDs
   * This allows us to rebuild only the accounts that actually had changes in this period
   */
  private async getAffectedAccountsForPeriod(
    tenantId: string,
    transactionIds: number[],
    periodStart: Date,
    periodEnd: Date
  ): Promise<number[]> {
    const result = await this.prisma.transaction.findMany({
      where: {
        tenant_id: tenantId,
        id: { in: transactionIds },
        date: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      select: { account_id: true },
      distinct: ['account_id']
    })

    return result.map(t => t.account_id)
  }

  /**
   * Get the earliest transaction date for a tenant (optionally for specific account)
   */
  private async getEarliestTransactionDate(tenantId: string, accountId?: number): Promise<Date | null> {
    const whereClause: any = { tenant_id: tenantId }
    if (accountId) {
      whereClause.account_id = accountId
    }

    const result = await this.prisma.transaction.findFirst({
      where: whereClause,
      select: { date: true },
      orderBy: { date: 'asc' }
    })

    return result?.date || null
  }

  /**
   * Get count of cube records for a specific period (optionally for specific account)
   */
  private async getCubeRecordCount(
    tenantId: string,
    periodType: 'WEEKLY' | 'MONTHLY',
    periodStart: Date,
    periodEnd: Date,
    accountId?: number
  ): Promise<number> {
    const whereClause: any = {
      tenant_id: tenantId,
      period_type: periodType,
      period_start: periodStart,
      period_end: periodEnd
    }

    if (accountId) {
      whereClause.account_id = accountId
    }

    const count = await this.prisma.financialCube.count({
      where: whereClause
    })

    return count
  }

  /**
   * Get cube statistics for a tenant
   */
  async getCubeStats(tenantId: string): Promise<{
    totalRecords: number
    weeklyRecords: number
    monthlyRecords: number
    dateRange: {
      earliest: Date | null
      latest: Date | null
    }
    lastUpdated: Date | null
  }> {
    const [totalCount, weeklyCount, monthlyCount, dateRange, lastUpdated] = await Promise.all([
      // Total records
      this.prisma.financialCube.count({
        where: { tenant_id: tenantId }
      }),

      // Weekly records
      this.prisma.financialCube.count({
        where: {
          tenant_id: tenantId,
          period_type: 'WEEKLY'
        }
      }),

      // Monthly records
      this.prisma.financialCube.count({
        where: {
          tenant_id: tenantId,
          period_type: 'MONTHLY'
        }
      }),

      // Date range
      this.prisma.financialCube.aggregate({
        where: { tenant_id: tenantId },
        _min: { period_start: true },
        _max: { period_end: true }
      }),

      // Last updated
      this.prisma.financialCube.findFirst({
        where: { tenant_id: tenantId },
        select: { updated_at: true },
        orderBy: { updated_at: 'desc' }
      })
    ])

    return {
      totalRecords: totalCount,
      weeklyRecords: weeklyCount,
      monthlyRecords: monthlyCount,
      dateRange: {
        earliest: dateRange._min.period_start,
        latest: dateRange._max.period_end
      },
      lastUpdated: lastUpdated?.updated_at || null
    }
  }

  /**
   * Get count of accounts for a tenant
   */
  private async getAccountCount(tenantId: string): Promise<number> {
    return await this.prisma.account.count({
      where: { tenant_id: tenantId }
    })
  }

  // Helper methods

  private async getCategoryName(categoryId: number | null): Promise<string> {
    if (!categoryId) return 'Uncategorized'

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true }
    })

    return category?.name || 'Uncategorized'
  }

  private async getAccountName(accountId: number): Promise<string> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { name: true }
    })

    return account?.name || 'Unknown Account'
  }
}

export const cubeService = new CubeService()
