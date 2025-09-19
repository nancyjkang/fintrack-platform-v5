import { BaseService } from '../base'
import type { FinancialCube, Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, format, addWeeks, addMonths } from 'date-fns'
import { getCurrentUTCDate, createUTCDate, addDays, toUTCMidnight, parseAndConvertToUTC, toUTCDateString } from '@/lib/utils/date-utils'

// Configuration: Week start day (0 = Sunday, 1 = Monday)
// Default to Sunday for US financial convention, but can be changed to Monday (1) for ISO standard
const WEEK_STARTS_ON = 0 // Sunday
import type {
  TransactionDelta,
  CubeRelevantFields,
  Period,
  CubeRegenerationTarget,
  DeltaProcessingResult,
  BulkUpdateMetadata
} from '@/lib/types/cube-delta.types'

// Transaction interface for cube operations
interface CubeTransaction {
  id: number
  date: Date
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  category_id: number | null
  is_recurring: boolean
  amount?: number | Decimal
}

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
    // Build the query dynamically based on whether accountId is provided
    const baseQuery = `
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
      WHERE t.tenant_id = $1
        AND t.date >= $2
        AND t.date <= $3`

    const accountFilter = accountId ? ` AND t.account_id = $4` : ''
    const groupByClause = `
      GROUP BY
        t.type,
        t.category_id,
        t.account_id,
        t.is_recurring
      HAVING COUNT(*) > 0`

    const fullQuery = baseQuery + accountFilter + groupByClause

    const queryParams = accountId
      ? [tenantId, periodStart, periodEnd, accountId]
      : [tenantId, periodStart, periodEnd]

    const aggregations = await this.prisma.$queryRawUnsafe<Array<{
      transaction_type: string
      category_id: number | null
      category_name: string
      account_id: number
      account_name: string
      is_recurring: boolean
      total_amount: Decimal
      transaction_count: bigint
    }>>(fullQuery, ...queryParams)

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
   * Build cube data for specific regeneration targets within a period
   * This is more precise than rebuilding the entire period when we know exactly what changed
   */
  private async buildCubeForTargets(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
    periodType: 'WEEKLY' | 'MONTHLY',
    targets: CubeRegenerationTarget[]
  ): Promise<void> {
    // Process each target individually for maximum precision
    // This ensures we only query for data that actually needs regeneration
    for (const target of targets) {
      await this.buildCubeForSpecificCriteria(
        tenantId,
        periodStart,
        periodEnd,
        periodType,
        target.transactionType,
        [target.categoryId], // Single category per query
        target.isRecurring
      )
    }
  }

  /**
   * Build cube data for specific transaction type, categories, and recurring flag
   */
  private async buildCubeForSpecificCriteria(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
    periodType: 'WEEKLY' | 'MONTHLY',
    transactionType: string,
    categoryIds: (number | null)[],
    isRecurring: boolean
  ): Promise<void> {
    // Build the query with specific filters
    const baseQuery = `
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
      WHERE t.tenant_id = $1
        AND t.date >= $2
        AND t.date <= $3
        AND t.type = $4
        AND t.is_recurring = $5`

    // Add category filter - handle null categories properly
    let categoryFilter = ''
    const queryParams = [tenantId, periodStart, periodEnd, transactionType, isRecurring]

    if (categoryIds.length > 0) {
      const nonNullCategories = categoryIds.filter(id => id !== null)
      const hasNull = categoryIds.includes(null)

      if (nonNullCategories.length > 0 && hasNull) {
        // Both null and non-null categories
        categoryFilter = ` AND (t.category_id IN (${nonNullCategories.join(',')}) OR t.category_id IS NULL)`
      } else if (nonNullCategories.length > 0) {
        // Only non-null categories
        categoryFilter = ` AND t.category_id IN (${nonNullCategories.join(',')})`
      } else if (hasNull) {
        // Only null category
        categoryFilter = ` AND t.category_id IS NULL`
      }
    }

    const groupByClause = `
      GROUP BY
        t.type,
        t.category_id,
        t.account_id,
        t.is_recurring
      HAVING COUNT(*) > 0`

    const fullQuery = baseQuery + categoryFilter + groupByClause

    const aggregations = await this.prisma.$queryRawUnsafe<Array<{
      transaction_type: string
      category_id: number | null
      category_name: string
      account_id: number
      account_name: string
      is_recurring: boolean
      total_amount: Decimal
      transaction_count: bigint
    }>>(fullQuery, ...queryParams)

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
    console.log('[populateHistoricalData] Starting with tenantId:', tenantId, 'options:', options)
    const startTime = performance.now()

    // Default options
    console.log('[populateHistoricalData] Getting earliest transaction date...')
    const earliestDate = await this.getEarliestTransactionDate(tenantId, options.accountId)
    console.log('[populateHistoricalData] Earliest transaction date:', earliestDate)

    const {
      startDate = earliestDate,
      endDate = getCurrentUTCDate(),
      clearExisting = false,
      batchSize = 100,
      accountId
    } = options

    console.log('[populateHistoricalData] Final date range:', { startDate, endDate })

    if (!startDate) {
      console.log('[populateHistoricalData] No startDate found, returning early')
      return {
        periodsProcessed: 0,
        recordsCreated: 0,
        timeElapsed: performance.now() - startTime,
        accountsProcessed: 0
      }
    }

    // Clear existing cube data if requested
    if (clearExisting) {
      const deleteWhere: Prisma.FinancialCubeWhereInput = { tenant_id: tenantId }
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
          console.error(`Error processing period ${toUTCDateString(period.start)} - ${toUTCDateString(period.end)}:`, error)
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
      periodType?: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BI_ANNUALLY' | 'ANNUALLY'
      startDate?: Date
      endDate?: Date
      transactionType?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
      categoryIds?: number[]
      accountIds?: number[]
      isRecurring?: boolean
    } = {}
  ): Promise<FinancialCube[]> {
    // For standard periods (WEEKLY, MONTHLY), query directly from cube
    if (!filters.periodType || filters.periodType === 'WEEKLY' || filters.periodType === 'MONTHLY') {
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

    // For custom periods, aggregate from base data
    return this.getAggregatedTrends(tenantId, filters as {
      periodType: 'BI_WEEKLY' | 'QUARTERLY' | 'BI_ANNUALLY' | 'ANNUALLY'
      startDate?: Date
      endDate?: Date
      transactionType?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
      categoryIds?: number[]
      accountIds?: number[]
      isRecurring?: boolean
    })
  }

  /**
   * Get aggregated trends for custom period types
   */
  private async getAggregatedTrends(
    tenantId: string,
    filters: {
      periodType: 'BI_WEEKLY' | 'QUARTERLY' | 'BI_ANNUALLY' | 'ANNUALLY'
      startDate?: Date
      endDate?: Date
      transactionType?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
      categoryIds?: number[]
      accountIds?: number[]
      isRecurring?: boolean
    }
  ): Promise<FinancialCube[]> {
    // Determine base period type to aggregate from
    const basePeriodType = this.getBasePeriodType(filters.periodType)

    // Get base data
    const baseData = await this.getTrends(tenantId, {
      ...filters,
      periodType: basePeriodType
    })

    // Aggregate base data into custom periods
    return this.aggregateToCustomPeriods(baseData, filters.periodType)
  }

  /**
   * Determine which base period type to use for aggregation
   */
  private getBasePeriodType(customPeriodType: string): 'WEEKLY' | 'MONTHLY' {
    switch (customPeriodType) {
      case 'BI_WEEKLY':
        return 'WEEKLY'
      case 'QUARTERLY':
      case 'BI_ANNUALLY':
      case 'ANNUALLY':
        return 'MONTHLY'
      default:
        return 'MONTHLY'
    }
  }

  /**
   * Aggregate base period data into custom periods
   */
  private aggregateToCustomPeriods(
    baseData: FinancialCube[],
    customPeriodType: 'BI_WEEKLY' | 'QUARTERLY' | 'BI_ANNUALLY' | 'ANNUALLY'
  ): FinancialCube[] {
    const aggregatedData = new Map<string, FinancialCube>()

    for (const record of baseData) {
      const customPeriodStart = this.getCustomPeriodStart(record.period_start, customPeriodType)
      const key = `${customPeriodStart.toISOString()}-${record.transaction_type}-${record.category_id}-${record.account_id}-${record.is_recurring}`

      if (aggregatedData.has(key)) {
        const existing = aggregatedData.get(key)!
        existing.total_amount = existing.total_amount.add(record.total_amount)
        existing.transaction_count += record.transaction_count
      } else {
        aggregatedData.set(key, {
          ...record,
          period_start: customPeriodStart,
          period_type: customPeriodType,
          total_amount: record.total_amount
        })
      }
    }

    return Array.from(aggregatedData.values()).sort((a, b) => {
      const dateCompare = a.period_start.getTime() - b.period_start.getTime()
      if (dateCompare !== 0) return dateCompare
      return a.category_name.localeCompare(b.category_name)
    })
  }

  /**
   * Get the start date of the custom period that contains the given date
   */
  private getCustomPeriodStart(date: Date, periodType: string): Date {
    const year = date.getFullYear()
    const month = date.getMonth()

    switch (periodType) {
      case 'BI_WEEKLY':
        // Bi-weekly periods start every 14 days from a reference date
        const referenceDate = createUTCDate(year, 0, 1) // January 1st
        const daysSinceReference = Math.floor((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24))
        const biWeeklyPeriod = Math.floor(daysSinceReference / 14)
        return addDays(referenceDate, biWeeklyPeriod * 14)

      case 'QUARTERLY':
        const quarter = Math.floor(month / 3)
        return createUTCDate(year, quarter * 3, 1)

      case 'BI_ANNUALLY':
        const halfYear = Math.floor(month / 6)
        return createUTCDate(year, halfYear * 6, 1)

      case 'ANNUALLY':
        return createUTCDate(year, 0, 1)

      default:
        return date
    }
  }

  /**
   * Clear all cube data for a tenant
   */
  async clearAllData(tenantId: string): Promise<number> {
    const result = await this.prisma.financialCube.deleteMany({
      where: { tenant_id: tenantId }
    })
    return result.count
  }

  /**
   * Get cube statistics for a tenant
   */
  async getCubeStatistics(tenantId: string): Promise<{
    totalRecords: number
    weeklyRecords: number
    monthlyRecords: number
    dateRange: { earliest: Date | null; latest: Date | null }
    accountCount: number
    categoryCount: number
    lastUpdated: Date | null
  }> {
    try {
      console.log('[getCubeStatistics] Starting with tenantId:', tenantId)

      // Get total records
      console.log('[getCubeStatistics] Querying total records...')
      const totalRecords = await this.prisma.financialCube.count({
        where: { tenant_id: tenantId }
      })
      console.log('[getCubeStatistics] Total records result:', totalRecords)

      // Get records by period type
      console.log('[getCubeStatistics] Querying weekly records...')
      const weeklyRecords = await this.prisma.financialCube.count({
        where: {
          tenant_id: tenantId,
          period_type: 'WEEKLY'
        }
      })
      console.log('[getCubeStatistics] Weekly records result:', weeklyRecords)

      console.log('[getCubeStatistics] Querying monthly records...')
      const monthlyRecords = await this.prisma.financialCube.count({
        where: {
          tenant_id: tenantId,
          period_type: 'MONTHLY'
        }
      })
      console.log('[getCubeStatistics] Monthly records result:', monthlyRecords)

    // Get date range
    const dateRangeResult = await this.prisma.financialCube.aggregate({
      where: { tenant_id: tenantId },
      _min: { period_start: true },
      _max: { period_start: true }
    })

    // Get distinct counts
    const distinctCounts = await this.prisma.financialCube.groupBy({
      by: ['account_id', 'category_id'],
      where: { tenant_id: tenantId }
    })

    const accountCount = new Set(distinctCounts.map(d => d.account_id)).size
    const categoryCount = new Set(distinctCounts.filter(d => d.category_id).map(d => d.category_id)).size

    // Get last updated (most recent record)
    const lastRecord = await this.prisma.financialCube.findFirst({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      select: { created_at: true }
    })

      return {
        totalRecords,
        weeklyRecords,
        monthlyRecords,
        dateRange: {
          earliest: dateRangeResult._min.period_start,
          latest: dateRangeResult._max.period_start
        },
        accountCount,
        categoryCount,
        lastUpdated: lastRecord?.created_at || null
      }
    } catch (error) {
      console.error('Error in getCubeStatistics:', error)
      throw new Error(`Failed to get cube statistics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
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
    [key: string]: string | Date | number | boolean | null | Decimal
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
      [key: string]: string | Date | number | boolean | null | Decimal | bigint
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
    const whereClause: Prisma.FinancialCubeWhereInput = {
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
        periodStart = startOfWeek(current, { weekStartsOn: WEEK_STARTS_ON })
        periodEnd = endOfWeek(current, { weekStartsOn: WEEK_STARTS_ON })
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

  // REMOVED: getAffectedPeriods - obsolete with bulk metadata approach

  // REMOVED: getAffectedAccountsForPeriod - obsolete with bulk metadata approach

  /**
   * Get the earliest transaction date for a tenant (optionally for specific account)
   */
  private async getEarliestTransactionDate(tenantId: string, accountId?: number): Promise<Date | null> {
    const whereClause: Prisma.TransactionWhereInput = { tenant_id: tenantId }
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
    const whereClause: Prisma.FinancialCubeWhereInput = {
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

  // REMOVED: getCubeStats - replaced by getCubeStatistics which is more comprehensive

  /**
   * Get count of accounts for a tenant
   */
  private async getAccountCount(tenantId: string): Promise<number> {
    return await this.prisma.account.count({
      where: { tenant_id: tenantId }
    })
  }

  /**
   * Group cube regeneration targets by period for efficient batch processing
   */
  private groupCubesByPeriod(targets: CubeRegenerationTarget[]): Map<number, {
    tenantId: string
    periodType: 'WEEKLY' | 'MONTHLY'
    periodStart: Date
    targets: CubeRegenerationTarget[]
  }> {
    const groups = new Map<number, {
      tenantId: string
      periodType: 'WEEKLY' | 'MONTHLY'
      periodStart: Date
      targets: CubeRegenerationTarget[]
    }>()

    let keyCounter = 0

    for (const target of targets) {
      // Find existing group with matching tenant, period type, and period start
      let existingKey: number | undefined

      for (const [key, group] of groups) {
        if (group.tenantId === target.tenantId &&
            group.periodType === target.periodType &&
            group.periodStart.valueOf() === target.periodStart.valueOf()) {
          existingKey = key
          break
        }
      }

      if (existingKey !== undefined) {
        // Add to existing group
        groups.get(existingKey)!.targets.push(target)
      } else {
        // Create new group with incremental numeric key
        groups.set(keyCounter++, {
          tenantId: target.tenantId,
          periodType: target.periodType,
          periodStart: target.periodStart,
          targets: [target]
        })
      }
    }

    return groups
  }

  /**
   * Regenerate cube records for the affected periods
   * This clears and rebuilds only the specific cube records that need updating
   */
  private async regenerateCubeRecords(periodGroups: Map<number, {
    tenantId: string
    periodType: 'WEEKLY' | 'MONTHLY'
    periodStart: Date
    targets: CubeRegenerationTarget[]
  }>): Promise<void> {
    for (const [, periodGroup] of periodGroups) {
      const { tenantId, periodType, periodStart, targets } = periodGroup

      // Calculate period end
      const periodEnd = periodType === 'WEEKLY'
        ? endOfWeek(periodStart, { weekStartsOn: 1 })
        : endOfMonth(periodStart)

      // Clear existing cube records for this specific period and dimensions
      await this.clearSpecificCubeRecords(targets)

      // Rebuild cube data for the specific targets only
      await this.buildCubeForTargets(tenantId, periodStart, periodEnd, periodType, targets)
    }
  }

  /**
   * Clear specific cube records that match the regeneration targets
   */
  private async clearSpecificCubeRecords(
    targets: CubeRegenerationTarget[]
  ): Promise<void> {
    if (targets.length === 0) return

    // Extract tenant_id (should be the same for all targets)
    const tenantId = targets[0].tenantId

    // Build OR conditions for each target using specific criteria (without tenant_id)
    const orConditions = targets.map(target => ({
      period_type: target.periodType,
      period_start: target.periodStart,
      transaction_type: target.transactionType,
      category_id: target.categoryId,
      is_recurring: target.isRecurring
      // Note: Using specific criteria including is_recurring (no account_id)
    }))

    await this.prisma.financialCube.deleteMany({
      where: {
        tenant_id: tenantId,
        OR: orConditions
      }
    })
  }

  /**
   * Extract unique periods affected by the regeneration targets
   */
  private extractAffectedPeriods(targets: CubeRegenerationTarget[]): Period[] {
    const periodSet = new Set<string>()
    const periods: Period[] = []

    for (const target of targets) {
      const periodEnd = target.periodType === 'WEEKLY'
        ? endOfWeek(target.periodStart, { weekStartsOn: 1 })
        : endOfMonth(target.periodStart)

      const key = `${target.periodType}-${toUTCDateString(target.periodStart)}`

      if (!periodSet.has(key)) {
        periodSet.add(key)
        periods.push({
          type: target.periodType,
          start: target.periodStart,
          end: periodEnd
        })
      }
    }

    return periods
  }

  /**
   * Create a transaction delta for INSERT operations
   */
  static createInsertDelta(
    transactionId: number,
    tenantId: string,
    newValues: CubeRelevantFields,
    userId?: string
  ): TransactionDelta {
    return {
      transactionId,
      operation: 'INSERT',
      tenantId,
      newValues,
      timestamp: getCurrentUTCDate(),
      userId
    }
  }

  /**
   * Create a transaction delta for UPDATE operations
   */
  static createUpdateDelta(
    transactionId: number,
    tenantId: string,
    oldValues: CubeRelevantFields,
    newValues: CubeRelevantFields,
    userId?: string
  ): TransactionDelta {
    return {
      transactionId,
      operation: 'UPDATE',
      tenantId,
      oldValues,
      newValues,
      timestamp: getCurrentUTCDate(),
      userId
    }
  }

  /**
   * Create a transaction delta for DELETE operations
   */
  static createDeleteDelta(
    transactionId: number,
    tenantId: string,
    oldValues: CubeRelevantFields,
    userId?: string
  ): TransactionDelta {
    return {
      transactionId,
      operation: 'DELETE',
      tenantId,
      oldValues,
      timestamp: getCurrentUTCDate(),
      userId
    }
  }

  // ============================================================================
  // BULK METADATA APPROACH - Superior for bulk operations
  // ============================================================================

  /**
   * Update cube using bulk metadata approach - much more efficient for bulk operations
   */
  async updateCubeWithBulkMetadata(bulkUpdate: BulkUpdateMetadata): Promise<DeltaProcessingResult> {
    if (bulkUpdate.affectedTransactionIds.length === 0) {
      return {
        cubesToRegenerate: [],
        affectedPeriods: [],
        totalDeltas: 0,
        processedAt: getCurrentUTCDate()
      }
    }

    // Step 1: Calculate affected periods from date range (not individual dates!)
    const periods = await this.calculatePeriodsForDateRange(
      bulkUpdate.dateRange?.startDate || await this.getEarliestTransactionDateForIds(bulkUpdate.affectedTransactionIds),
      bulkUpdate.dateRange?.endDate || await this.getLatestTransactionDateForIds(bulkUpdate.affectedTransactionIds)
    )

    // Step 2: Direct calculation of regeneration targets based on changed fields
    const targets = await this.calculateRegenerationTargetsFromBulk(bulkUpdate, periods)

    // Step 3: Group and regenerate (same as delta approach)
    const periodGroups = this.groupCubesByPeriod(targets)
    await this.regenerateCubeRecords(periodGroups)

    return {
      cubesToRegenerate: targets,
      affectedPeriods: this.extractAffectedPeriods(targets),
      totalDeltas: bulkUpdate.affectedTransactionIds.length,
      processedAt: getCurrentUTCDate()
    }
  }

  /**
   * Calculate periods for a date range
   */
  private async calculatePeriodsForDateRange(startDate: Date, endDate: Date): Promise<Period[]> {
    const periods: Period[] = []

    // Generate weekly periods
    let currentWeekStart = startOfWeek(startDate, { weekStartsOn: WEEK_STARTS_ON })
    const lastWeekStart = startOfWeek(endDate, { weekStartsOn: WEEK_STARTS_ON })

    while (currentWeekStart <= lastWeekStart) {
      periods.push({
        type: 'WEEKLY',
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
      })
      currentWeekStart = addWeeks(currentWeekStart, 1)
    }

    // Generate monthly periods
    let currentMonthStart = startOfMonth(startDate)
    const lastMonthStart = startOfMonth(endDate)

    while (currentMonthStart <= lastMonthStart) {
      periods.push({
        type: 'MONTHLY',
        start: currentMonthStart,
        end: endOfMonth(currentMonthStart)
      })
      currentMonthStart = addMonths(currentMonthStart, 1)
    }

    return periods
  }

  /**
   * Calculate regeneration targets directly from bulk metadata
   */
  private async calculateRegenerationTargetsFromBulk(
    bulkUpdate: BulkUpdateMetadata,
    periods: Period[]
  ): Promise<CubeRegenerationTarget[]> {
    const targets: CubeRegenerationTarget[] = []

    // Get transaction types and recurring flags for the affected transactions (we'll need this for most changes)
    const transactionTypes = await this.getTransactionTypesForTransactions(bulkUpdate.affectedTransactionIds)
    const recurringFlags = await this.getRecurringFlagsForTransactions(bulkUpdate.affectedTransactionIds)

    for (const change of bulkUpdate.changedFields) {
      for (const period of periods) {

        if (change.fieldName === 'category_id') {
          // Category change affects both old and new category cubes
          // Need to regenerate for all transaction types and recurring flags of affected transactions
          for (const transactionType of transactionTypes) {
            for (const isRecurring of recurringFlags) {
              if (change.oldValue !== null) {
                targets.push({
                  tenantId: bulkUpdate.tenantId,
                  periodType: period.type,
                  periodStart: period.start,
                  periodEnd: period.end,
                  transactionType: transactionType,
                  categoryId: change.oldValue as number | null,
                  isRecurring: isRecurring
                })
              }

              if (change.newValue !== null) {
                targets.push({
                  tenantId: bulkUpdate.tenantId,
                  periodType: period.type,
                  periodStart: period.start,
                  periodEnd: period.end,
                  transactionType: transactionType,
                  categoryId: change.newValue as number | null,
                  isRecurring: isRecurring
                })
              }
            }
          }
        }

        if (change.fieldName === 'account_id') {
          // Account change - regenerate for the categories, transaction types, and recurring flags
          const affectedCategories = await this.getCategoriesForTransactions(bulkUpdate.affectedTransactionIds)

          for (const transactionType of transactionTypes) {
            for (const isRecurring of recurringFlags) {
              for (const categoryId of affectedCategories) {
                targets.push({
                  tenantId: bulkUpdate.tenantId,
                  periodType: period.type,
                  periodStart: period.start,
                  periodEnd: period.end,
                  transactionType: transactionType,
                  categoryId: categoryId,
                  isRecurring: isRecurring
                })
              }
            }
          }
        }

        if (change.fieldName === 'type') {
          // Transaction type change affects both old and new types
          const affectedCategories = await this.getCategoriesForTransactions(bulkUpdate.affectedTransactionIds)

          for (const isRecurring of recurringFlags) {
            for (const categoryId of affectedCategories) {
              // Old type
              targets.push({
                tenantId: bulkUpdate.tenantId,
                periodType: period.type,
                periodStart: period.start,
                periodEnd: period.end,
                transactionType: change.oldValue as 'INCOME' | 'EXPENSE' | 'TRANSFER',
                categoryId: categoryId,
                isRecurring: isRecurring
              })

              // New type
              targets.push({
                tenantId: bulkUpdate.tenantId,
                periodType: period.type,
                periodStart: period.start,
                periodEnd: period.end,
                transactionType: change.newValue as 'INCOME' | 'EXPENSE' | 'TRANSFER',
                categoryId: categoryId,
                isRecurring: isRecurring
              })
            }
          }
        }

        if (change.fieldName === 'amount') {
          // Amount change - regenerate for existing categories, types, and recurring flags
          const affectedCategories = await this.getCategoriesForTransactions(bulkUpdate.affectedTransactionIds)

          for (const transactionType of transactionTypes) {
            for (const isRecurring of recurringFlags) {
              for (const categoryId of affectedCategories) {
                targets.push({
                  tenantId: bulkUpdate.tenantId,
                  periodType: period.type,
                  periodStart: period.start,
                  periodEnd: period.end,
                  transactionType: transactionType,
                  categoryId: categoryId,
                  isRecurring: isRecurring
                })
              }
            }
          }
        }

        if (change.fieldName === 'is_recurring') {
          // Recurring change affects both old and new recurring flags
          const affectedCategories = await this.getCategoriesForTransactions(bulkUpdate.affectedTransactionIds)

          for (const transactionType of transactionTypes) {
            for (const categoryId of affectedCategories) {
              // Old recurring flag
              targets.push({
                tenantId: bulkUpdate.tenantId,
                periodType: period.type,
                periodStart: period.start,
                periodEnd: period.end,
                transactionType: transactionType,
                categoryId: categoryId,
                isRecurring: change.oldValue as boolean
              })

              // New recurring flag
              targets.push({
                tenantId: bulkUpdate.tenantId,
                periodType: period.type,
                periodStart: period.start,
                periodEnd: period.end,
                transactionType: transactionType,
                categoryId: categoryId,
                isRecurring: change.newValue as boolean
              })
            }
          }
        }

        if (change.fieldName === 'date') {
          // Date change is complex - might fall back to individual delta processing
          throw new Error('Date changes in bulk updates not yet supported. Use individual transaction updates.')
        }
      }
    }

    // Remove duplicates (much smaller set than individual delta approach)
    return this.deduplicateTargets(targets)
  }

  /**
   * Get unique transaction types for a set of transactions
   */
  private async getTransactionTypesForTransactions(transactionIds: number[]): Promise<('INCOME' | 'EXPENSE' | 'TRANSFER')[]> {
    const result = await this.prisma.transaction.findMany({
      where: { id: { in: transactionIds } },
      select: { type: true },
      distinct: ['type']
    })

    return result.map(t => t.type as 'INCOME' | 'EXPENSE' | 'TRANSFER')
  }

  /**
   * Get unique recurring flags for a set of transactions
   */
  private async getRecurringFlagsForTransactions(transactionIds: number[]): Promise<boolean[]> {
    const result = await this.prisma.transaction.findMany({
      where: { id: { in: transactionIds } },
      select: { is_recurring: true },
      distinct: ['is_recurring']
    })

    return result.map(t => t.is_recurring)
  }

  /**
   * Get unique categories for a set of transactions
   */
  private async getCategoriesForTransactions(transactionIds: number[]): Promise<(number | null)[]> {
    const result = await this.prisma.transaction.findMany({
      where: { id: { in: transactionIds } },
      select: { category_id: true },
      distinct: ['category_id']
    })

    return result.map(t => t.category_id)
  }

  /**
   * Get earliest transaction date for a set of transactions
   */
  private async getEarliestTransactionDateForIds(transactionIds: number[]): Promise<Date> {
    const result = await this.prisma.transaction.findFirst({
      where: { id: { in: transactionIds } },
      select: { date: true },
      orderBy: { date: 'asc' }
    })

    return result?.date || getCurrentUTCDate()
  }

  /**
   * Get latest transaction date for a set of transactions
   */
  private async getLatestTransactionDateForIds(transactionIds: number[]): Promise<Date> {
    const result = await this.prisma.transaction.findFirst({
      where: { id: { in: transactionIds } },
      select: { date: true },
      orderBy: { date: 'desc' }
    })

    return result?.date || getCurrentUTCDate()
  }

  /**
   * Remove duplicate targets using JSON-based deduplication
   */
  private deduplicateTargets(targets: CubeRegenerationTarget[]): CubeRegenerationTarget[] {
    const seen = new Set<string>()
    const unique: CubeRegenerationTarget[] = []

    for (const target of targets) {
      const key = JSON.stringify({
        tenantId: target.tenantId,
        periodType: target.periodType,
        periodStart: toUTCDateString(target.periodStart),
        transactionType: target.transactionType,
        categoryId: target.categoryId,
        isRecurring: target.isRecurring
      })

      if (!seen.has(key)) {
        seen.add(key)
        unique.push(target)
      }
    }

    return unique
  }

  // ===================================================================
  // Individual Transaction Cube Integration Methods
  // ===================================================================

  /**
   * Add a new transaction to the cube (INSERT operation)
   * No delta needed - just add the transaction's impact to affected periods
   */
  async addTransaction(transaction: CubeTransaction, tenantId: string): Promise<void> {
    return this.syncTransactionToCube(transaction, tenantId, 'add')
  }

  /**
   * Update a transaction in the cube (UPDATE operation)
   * Uses delta to precisely update only affected cube dimensions
   */
  async updateTransaction(delta: TransactionDelta, tenantId: string): Promise<void> {
    try {
      // Convert the single delta to bulk metadata format for processing
      const bulkMetadata = this.convertDeltaToBulkMetadata(delta, tenantId)
      await this.updateCubeWithBulkMetadata(bulkMetadata)
    } catch (error) {
      console.warn('Failed to update transaction in cube:', error)
      // Don't throw - cube updates should not fail transaction updates
    }
  }

  /**
   * Remove a transaction from the cube (DELETE operation)
   * No delta needed - just remove the transaction's impact from affected periods
   */
  async removeTransaction(transaction: CubeTransaction, tenantId: string): Promise<void> {
    return this.syncTransactionToCube(transaction, tenantId, 'remove')
  }

  /**
   * Sync a single transaction to the cube (add or remove)
   * Regenerates the weekly and monthly periods for the transaction date
   *
   * This method consolidates the common logic between addTransaction and removeTransaction
   * since both operations require the same cube regeneration approach.
   */
  private async syncTransactionToCube(
    transaction: CubeTransaction,
    tenantId: string,
    operation: 'add' | 'remove'
  ): Promise<void> {
    try {
      // Calculate weekly and monthly periods for this transaction date
      const date = transaction.date

      // Weekly period - use consistent week start configuration
      const weekStart = startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON })
      const weekEnd = endOfWeek(date, { weekStartsOn: WEEK_STARTS_ON })

      // Monthly period
      const monthStart = createUTCDate(date.getUTCFullYear(), date.getUTCMonth(), 1)
      const monthEnd = createUTCDate(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)

      // Process both periods
      const periods: Array<['WEEKLY' | 'MONTHLY', Date, Date]> = [
        ['WEEKLY', weekStart, weekEnd],
        ['MONTHLY', monthStart, monthEnd]
      ]

      for (const [periodType, periodStart, periodEnd] of periods) {
        const targets: CubeRegenerationTarget[] = [{
          tenantId,
          periodType,
          periodStart,
          periodEnd,
          transactionType: transaction.type,
          categoryId: transaction.category_id,
          isRecurring: transaction.is_recurring
        }]

        await this.clearSpecificCubeRecords(targets)
        await this.buildCubeForTargets(tenantId, periodStart, periodEnd, periodType, targets)
      }
    } catch (error) {
      console.warn(`Failed to ${operation} transaction to cube:`, error)
      // Don't throw - cube updates should not fail transaction operations
    }
  }

  /**
   * Helper method to convert a single TransactionDelta to BulkUpdateMetadata
   * This allows UPDATE operations to reuse the existing bulk processing logic
   */
  private convertDeltaToBulkMetadata(delta: TransactionDelta, tenantId: string): BulkUpdateMetadata {
    const changedFields: BulkUpdateMetadata['changedFields'] = []

    // Compare old and new values to identify what actually changed
    if (delta.oldValues && delta.newValues) {
      const oldVals = delta.oldValues
      const newVals = delta.newValues

      if (oldVals.account_id !== newVals.account_id) {
        changedFields.push({
          fieldName: 'account_id',
          oldValue: oldVals.account_id,
          newValue: newVals.account_id
        })
      }

      if (oldVals.category_id !== newVals.category_id) {
        changedFields.push({
          fieldName: 'category_id',
          oldValue: oldVals.category_id,
          newValue: newVals.category_id
        })
      }

      if (!oldVals.amount.equals(newVals.amount)) {
        changedFields.push({
          fieldName: 'amount',
          oldValue: oldVals.amount.toNumber(),
          newValue: newVals.amount.toNumber()
        })
      }

      if (oldVals.date.valueOf() !== newVals.date.valueOf()) {
        changedFields.push({
          fieldName: 'date',
          oldValue: toUTCDateString(oldVals.date),
          newValue: toUTCDateString(newVals.date)
        })
      }

      if (oldVals.type !== newVals.type) {
        changedFields.push({
          fieldName: 'type',
          oldValue: oldVals.type,
          newValue: newVals.type
        })
      }

      if (oldVals.is_recurring !== newVals.is_recurring) {
        changedFields.push({
          fieldName: 'is_recurring',
          oldValue: oldVals.is_recurring,
          newValue: newVals.is_recurring
        })
      }
    }

    return {
      tenantId,
      affectedTransactionIds: [delta.transactionId],
      changedFields,
      dateRange: {
        startDate: delta.newValues?.date || delta.oldValues?.date || getCurrentUTCDate(),
        endDate: delta.newValues?.date || delta.oldValues?.date || getCurrentUTCDate()
      }
    }
  }
}

export const cubeService = new CubeService()
