import { BaseService } from '../base'
import type {
  CSVFormat,
  ColumnMapping,
  ParsedTransaction,
  ParseResult,
  AmountDetection,
  TransactionToImport,
  ExistingTransaction,
  DuplicateDetectionResult,
  ImportResult,
  ImportOptions
} from '@/lib/types/csv-import.types'

export class CSVImportService extends BaseService {
  /**
   * Detect CSV format from content
   */
  async detectFormat(csvContent: string): Promise<CSVFormat> {
    const lines = csvContent.split('\n').filter(line => line.trim())
    if (lines.length === 0) {
      throw new Error('CSV file is empty')
    }

    // Detect delimiter
    const delimiter = this.detectDelimiter(lines[0])

    // Detect if has header
    const hasHeader = this.detectHeader(lines, delimiter)

    // Detect encoding (simplified - assume UTF-8 for now)
    const encoding = 'utf-8' as const

    // Detect quote character
    const quoteChar = this.detectQuoteChar(lines[0])

    return {
      delimiter,
      hasHeader,
      encoding,
      quoteChar,
      escapeChar: '\\',
      dateFormat: 'auto' // Will be detected during parsing
    }
  }

  /**
   * Parse CSV content with automatic format detection
   */
  async parseCSV(csvContent: string, format?: CSVFormat): Promise<ParseResult> {
    try {
      const detectedFormat = format || await this.detectFormat(csvContent)
      const lines = csvContent.split('\n').filter(line => line.trim())

      if (lines.length === 0) {
        return { transactions: [], errors: ['CSV file is empty'] }
      }

      // Parse header row
      const headerRow = detectedFormat.hasHeader ? lines[0] : null
      const headers = headerRow ? this.parseCsvRow(headerRow, detectedFormat.delimiter) : []

      // Auto-detect columns
      const detectedColumns = this.detectColumns(headers)

      // Parse data rows
      const dataRows = lines.slice(detectedFormat.hasHeader ? 1 : 0)
      const transactions: ParsedTransaction[] = []
      const errors: string[] = []

      // Detect amount patterns for debit/credit columns
      let amountDetection: AmountDetection | undefined
      if (detectedColumns.debit !== undefined || detectedColumns.credit !== undefined) {
        amountDetection = this.detectAmountPattern(dataRows, detectedColumns, detectedFormat.delimiter)
      }

      for (let i = 0; i < dataRows.length; i++) {
        try {
          const row = this.parseCsvRow(dataRows[i], detectedFormat.delimiter)
          const transaction = this.parseTransactionRow(row, detectedColumns, amountDetection)

          if (transaction) {
            transactions.push(transaction)
          }
        } catch (error) {
          errors.push(`Row ${i + (detectedFormat.hasHeader ? 2 : 1)}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return {
        transactions,
        errors,
        detectedColumns,
        amountDetection
      }
    } catch (error) {
      return {
        transactions: [],
        errors: [error instanceof Error ? error.message : 'Failed to parse CSV']
      }
    }
  }

  /**
   * Parse CSV with explicit column mapping
   */
  async parseCSVWithMapping(
    csvContent: string,
    mapping: ColumnMapping,
    userOverrideDetection?: boolean,
    debitInterpretation?: 'positive' | 'negative',
    creditInterpretation?: 'positive' | 'negative'
  ): Promise<ParseResult> {
    try {
      const format = await this.detectFormat(csvContent)
      const lines = csvContent.split('\n').filter(line => line.trim())

      if (lines.length === 0) {
        return { transactions: [], errors: ['CSV file is empty'] }
      }

      const dataRows = lines.slice(format.hasHeader ? 1 : 0)
      const transactions: ParsedTransaction[] = []
      const errors: string[] = []

      for (let i = 0; i < dataRows.length; i++) {
        try {
          const row = this.parseCsvRow(dataRows[i], format.delimiter)
          const transaction = this.parseTransactionRowWithMapping(
            row,
            mapping,
            debitInterpretation,
            creditInterpretation
          )

          if (transaction) {
            transactions.push(transaction)
          }
        } catch (error) {
          errors.push(`Row ${i + (format.hasHeader ? 2 : 1)}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return { transactions, errors }
    } catch (error) {
      return {
        transactions: [],
        errors: [error instanceof Error ? error.message : 'Failed to parse CSV with mapping']
      }
    }
  }

  /**
   * Detect delimiter from first line
   */
  private detectDelimiter(firstLine: string): ',' | ';' | '\t' | '|' {
    const delimiters = [',', ';', '\t', '|'] as const
    let maxCount = 0
    let bestDelimiter: ',' | ';' | '\t' | '|' = ','

    for (const delimiter of delimiters) {
      const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length
      if (count > maxCount) {
        maxCount = count
        bestDelimiter = delimiter
      }
    }

    return bestDelimiter
  }

  /**
   * Detect if CSV has header row
   */
  private detectHeader(lines: string[], delimiter: string): boolean {
    if (lines.length < 2) return true // Assume header if only one line

    const firstRow = this.parseCsvRow(lines[0], delimiter)
    const secondRow = this.parseCsvRow(lines[1], delimiter)

    // Check if first row contains non-numeric values while second row has numbers
    const firstRowHasText = firstRow.some(cell => isNaN(parseFloat(cell)) && cell.trim() !== '')
    const secondRowHasNumbers = secondRow.some(cell => !isNaN(parseFloat(cell)))

    return firstRowHasText && secondRowHasNumbers
  }

  /**
   * Detect quote character
   */
  private detectQuoteChar(firstLine: string): '"' | "'" {
    const doubleQuoteCount = (firstLine.match(/"/g) || []).length
    const singleQuoteCount = (firstLine.match(/'/g) || []).length

    return doubleQuoteCount >= singleQuoteCount ? '"' : "'"
  }

  /**
   * Parse a single CSV row
   */
  private parseCsvRow(row: string, delimiter: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
      const quoteChar = '"'

    for (let i = 0; i < row.length; i++) {
      const char = row[i]

      if (char === quoteChar && !inQuotes) {
        inQuotes = true
      } else if (char === quoteChar && inQuotes) {
        if (row[i + 1] === quoteChar) {
          // Escaped quote
          current += quoteChar
          i++ // Skip next quote
        } else {
          inQuotes = false
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  /**
   * Auto-detect column positions
   */
  private detectColumns(headers: string[]): ParseResult['detectedColumns'] {
    const detected: ParseResult['detectedColumns'] = {}

    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase().trim()

      // Date detection
      if (['date', 'transaction date', 'posted date', 'effective date'].some(pattern =>
        lowerHeader.includes(pattern))) {
        detected.date = index
      }

      // Description detection
      if (['description', 'memo', 'reference', 'payee', 'merchant'].some(pattern =>
        lowerHeader.includes(pattern))) {
        detected.description = index
      }

      // Amount detection
      if (['amount', 'transaction amount'].some(pattern =>
        lowerHeader.includes(pattern))) {
        detected.amount = index
      }

      // Debit detection
      if (['debit', 'withdrawal', 'out'].some(pattern =>
        lowerHeader.includes(pattern))) {
        detected.debit = index
      }

      // Credit detection
      if (['credit', 'deposit', 'in'].some(pattern =>
        lowerHeader.includes(pattern))) {
        detected.credit = index
      }

      // Category detection
      if (['category', 'type', 'classification'].some(pattern =>
        lowerHeader.includes(pattern))) {
        detected.category = index
      }

      // Recurring detection
      if (['recurring', 'is_recurring', 'repeat', 'repeating'].some(pattern =>
        lowerHeader.includes(pattern))) {
        detected.recurring = index
      }

      // Notes detection
      if (['notes', 'memo', 'comment'].some(pattern =>
        lowerHeader.includes(pattern))) {
        detected.notes = index
      }
    })

    return detected
  }

  /**
   * Detect amount pattern for debit/credit columns
   */
  private detectAmountPattern(
    dataRows: string[],
    detectedColumns: ParseResult['detectedColumns'],
    delimiter: string
  ): AmountDetection {
    let positiveDebits = 0
    let negativeDebits = 0
    let positiveCredits = 0
    let negativeCredits = 0
    let totalDebits = 0
    let totalCredits = 0

    // Sample first 10 rows for pattern detection
    const sampleRows = dataRows.slice(0, Math.min(10, dataRows.length))

    for (const row of sampleRows) {
      const cells = this.parseCsvRow(row, delimiter)

      if (detectedColumns.debit !== undefined) {
        const debitValue = parseFloat(cells[detectedColumns.debit] || '0')
        if (!isNaN(debitValue) && debitValue !== 0) {
          totalDebits++
          if (debitValue > 0) positiveDebits++
          else negativeDebits++
        }
      }

      if (detectedColumns.credit !== undefined) {
        const creditValue = parseFloat(cells[detectedColumns.credit] || '0')
        if (!isNaN(creditValue) && creditValue !== 0) {
          totalCredits++
          if (creditValue > 0) positiveCredits++
          else negativeCredits++
        }
      }
    }

    // Determine pattern based on majority
    const mostlyPositiveDebits = positiveDebits > negativeDebits
    const mostlyNegativeDebits = negativeDebits > positiveDebits
    const mostlyPositiveCredits = positiveCredits > negativeCredits
    const mostlyNegativeCredits = negativeCredits > positiveCredits

    let pattern: AmountDetection['pattern'] = 'standard_debit_credit'
    let confidence: AmountDetection['confidence'] = 'medium'
    let recommendation = ''

    if (mostlyNegativeDebits && mostlyPositiveCredits) {
      pattern = 'inverted_debits'
      recommendation = 'Inverted debits detected - debits are negative, credits are positive'
    } else if (mostlyPositiveDebits && mostlyNegativeCredits) {
      pattern = 'inverted_credits'
      recommendation = 'Inverted credits detected - debits are positive, credits are negative'
    } else if (mostlyNegativeDebits && mostlyNegativeCredits) {
      pattern = 'both_inverted'
      recommendation = 'Both inverted - both debits and credits are negative'
    } else {
      recommendation = 'Standard format - debits are positive (expenses), credits are positive (income)'
    }

    // Determine confidence
    const totalSamples = totalDebits + totalCredits
    if (totalSamples >= 5) {
      confidence = 'high'
    } else if (totalSamples >= 2) {
      confidence = 'medium'
    } else {
      confidence = 'low'
    }

    return {
      pattern,
      confidence,
      recommendation,
      debitCount: totalDebits,
      creditCount: totalCredits
    }
  }

  /**
   * Parse transaction row with auto-detected columns
   */
  private parseTransactionRow(
    row: string[],
    detectedColumns: ParseResult['detectedColumns'],
    amountDetection?: AmountDetection
  ): ParsedTransaction | null {
    // Must have date and description at minimum
    if (detectedColumns.date === undefined || detectedColumns.description === undefined) {
      return null
    }

    const date = row[detectedColumns.date]?.trim()
    const description = row[detectedColumns.description]?.trim()

    if (!date || !description) {
      return null
    }

    // Calculate amount
    let amount = 0
    if (detectedColumns.amount !== undefined) {
      amount = parseFloat(row[detectedColumns.amount] || '0')
    } else if (detectedColumns.debit !== undefined || detectedColumns.credit !== undefined) {
      const debitValue = detectedColumns.debit !== undefined ?
        parseFloat(row[detectedColumns.debit] || '0') : 0
      const creditValue = detectedColumns.credit !== undefined ?
        parseFloat(row[detectedColumns.credit] || '0') : 0

      // Apply amount pattern logic
      if (amountDetection) {
        switch (amountDetection.pattern) {
          case 'inverted_debits':
            amount = -debitValue + creditValue
            break
          case 'inverted_credits':
            amount = -debitValue - creditValue
            break
          case 'both_inverted':
            amount = Math.abs(debitValue) - Math.abs(creditValue)
            break
          default:
            amount = -debitValue + creditValue
        }
      } else {
        amount = -debitValue + creditValue
      }
    }

    if (isNaN(amount)) {
      throw new Error('Invalid amount value')
    }

    return {
      date,
      description,
      amount,
      category: detectedColumns.category !== undefined ? row[detectedColumns.category]?.trim() : undefined,
      recurring: detectedColumns.recurring !== undefined ? this.parseRecurringValue(row[detectedColumns.recurring]?.trim()) : undefined,
      notes: detectedColumns.notes !== undefined ? row[detectedColumns.notes]?.trim() : undefined
    }
  }

  /**
   * Parse recurring value from CSV cell
   */
  private parseRecurringValue(value?: string): boolean | undefined {
    if (!value) return undefined

    const lowerValue = value.toLowerCase().trim()

    // Handle boolean-like values
    if (['true', '1', 'yes', 'y', 'recurring', 'repeat'].includes(lowerValue)) {
      return true
    }

    if (['false', '0', 'no', 'n', 'once', 'single'].includes(lowerValue)) {
      return false
    }

    // If we can't parse it, return undefined (will be treated as non-recurring)
    return undefined
  }

  /**
   * Parse transaction row with explicit mapping
   */
  private parseTransactionRowWithMapping(
    row: string[],
    mapping: ColumnMapping,
    debitInterpretation?: 'positive' | 'negative',
    creditInterpretation?: 'positive' | 'negative'
  ): ParsedTransaction | null {
    const date = mapping.date !== -1 ? row[mapping.date]?.trim() : ''
    const description = mapping.description !== -1 ? row[mapping.description]?.trim() : ''

    if (!date || !description) {
      return null
    }

    // Calculate amount
    let amount = 0
    if (mapping.amount !== -1) {
      amount = parseFloat(row[mapping.amount] || '0')
    } else if (mapping.debit !== undefined && mapping.credit !== undefined) {
      const debitValue = mapping.debit !== -1 ? parseFloat(row[mapping.debit] || '0') : 0
      const creditValue = mapping.credit !== -1 ? parseFloat(row[mapping.credit] || '0') : 0

      // Apply user interpretation
      const debitSign = debitInterpretation === 'negative' ? -1 : 1
      const creditSign = creditInterpretation === 'negative' ? -1 : 1

      amount = (debitValue * debitSign) + (creditValue * creditSign)
    }

    if (isNaN(amount)) {
      throw new Error('Invalid amount value')
    }

    return {
      date,
      description,
      amount,
      category: mapping.category !== -1 ? row[mapping.category]?.trim() : undefined,
      recurring: mapping.recurring !== -1 ? this.parseRecurringValue(row[mapping.recurring]?.trim()) : undefined,
      notes: mapping.notes !== -1 ? row[mapping.notes]?.trim() : undefined
    }
  }
}

// Export singleton instance
export const csvImportService = new CSVImportService()
