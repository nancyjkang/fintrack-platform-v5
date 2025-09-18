// CSV Import Types

export interface CSVFormat {
  delimiter: ',' | ';' | '\t' | '|'
  hasHeader: boolean
  encoding: 'utf-8' | 'ascii' | 'windows-1252'
  quoteChar: '"' | "'"
  escapeChar: string
  dateFormat: string
}

export interface ColumnMapping {
  date: number
  description: number
  amount: number
  debit?: number
  credit?: number
  account: number
  category: number
  recurring: number
  notes: number
  merchant?: number
  [key: string]: number | undefined
}

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  category?: string
  recurring?: boolean
  notes?: string
  merchant?: string
}

export interface ParseResult {
  transactions: ParsedTransaction[]
  errors: string[]
  detectedColumns?: {
    date?: number
    description?: number
    amount?: number
    debit?: number
    credit?: number
    category?: number
    recurring?: number
    notes?: number
  }
  amountDetection?: AmountDetection
}

export interface AmountDetection {
  pattern: 'standard_debit_credit' | 'inverted_debits' | 'inverted_credits' | 'both_inverted'
  confidence: 'high' | 'medium' | 'low'
  recommendation: string
  debitCount: number
  creditCount: number
}

export interface TransactionToImport {
  accountId: string
  amount: number
  description: string
  date: Date
  categoryId?: string
  tags: string[]
  notes: string | null
  pending: boolean
  isRecurring: boolean
}

export interface ExistingTransaction {
  id: string
  accountId: string
  amount: number
  description: string
  date: Date
  categoryId: string | null
  notes: string | null
  createdAt: Date
}

export interface DuplicateMatch {
  importTransaction: TransactionToImport
  existingTransaction: ExistingTransaction
  matchScore: number
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  matchReasons: string[]
}

export interface DuplicateDetectionResult {
  exactDuplicates: DuplicateMatch[]
  likelyDuplicates: DuplicateMatch[]
  uniqueTransactions: TransactionToImport[]
}

export interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
  duplicatesSkipped: number
}

export interface ImportOptions {
  skipDuplicates: boolean
  createCategories: boolean
  preserveBalance: boolean
}
