import { Decimal } from '@prisma/client/runtime/library'

/**
 * Represents a change to a transaction that affects the cube
 */
export interface TransactionDelta {
  transactionId: number
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  tenantId: string
  oldValues?: CubeRelevantFields
  newValues?: CubeRelevantFields
  timestamp: Date
  userId?: string
}

/**
 * Fields from a transaction that are relevant to cube calculations
 */
export interface CubeRelevantFields {
  account_id: number
  category_id: number | null
  amount: Decimal
  date: Date
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  is_recurring: boolean
}

/**
 * Represents a period (weekly or monthly) for cube calculations
 */
export interface Period {
  type: 'WEEKLY' | 'MONTHLY'
  start: Date
  end: Date
}

/**
 * Represents a cube record that needs to be regenerated
 * Updated to use broader criteria approach (no accountId, but includes isRecurring)
 */
export interface CubeRegenerationTarget {
  tenantId: string
  periodType: 'WEEKLY' | 'MONTHLY'
  periodStart: Date
  periodEnd: Date
  transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  categoryId: number | null
  isRecurring: boolean
}

/**
 * Bulk update metadata for efficient cube updates
 */
export interface BulkUpdateMetadata {
  tenantId: string
  affectedTransactionIds: number[]
  changedFields: {
    fieldName: keyof CubeRelevantFields
    oldValue: string | number | boolean | Date | Decimal | null
    newValue: string | number | boolean | Date | Decimal | null
  }[]
  dateRange?: {
    startDate: Date
    endDate: Date
  }
}

/**
 * Result of delta processing showing what needs to be regenerated
 */
export interface DeltaProcessingResult {
  cubesToRegenerate: CubeRegenerationTarget[]
  affectedPeriods: Period[]
  totalDeltas: number
  processedAt: Date
}
