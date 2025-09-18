'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { csvImportService } from '@/lib/services/csv-import'
import type { ParseResult, ColumnMapping } from '@/lib/types/csv-import.types'
import { formatDateForDisplay } from '@/lib/utils/date-utils'

// Types
type ImportStep = 'upload' | 'mapping' | 'review' | 'importing'

interface ProgressStepProps {
  id: string
  title: string
  stepNumber: number
  isActive: boolean
  isCompleted: boolean
  isLast?: boolean
}

function ProgressStep({ title, stepNumber, isActive, isCompleted, isLast }: ProgressStepProps) {
  return (
    <div className="flex items-center">
      <div className={`flex items-center ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
          isActive ? 'border-blue-600 bg-blue-50' :
          isCompleted ? 'border-green-600 bg-green-50' :
          'border-gray-300 bg-gray-50'
        }`}>
          {isCompleted ? '✓' : stepNumber}
        </div>
        <span className="ml-2 font-medium">{title}</span>
      </div>
      {!isLast && (
        <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`}></div>
      )}
    </div>
  )
}

export default function ImportTransactionsPage() {
  const router = useRouter()
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [csvContent, setCsvContent] = useState<string>('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null)
  const [debitInterpretation, setDebitInterpretation] = useState<'positive' | 'negative'>('positive')
  const [creditInterpretation, setCreditInterpretation] = useState<'positive' | 'negative'>('positive')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock accounts data - will be replaced with real API call
  const accounts = [
    { id: '1', name: 'Checking Account', type: 'CHECKING', currency: 'USD', currentBalance: 1500.00, isActive: true },
    { id: '2', name: 'Savings Account', type: 'SAVINGS', currency: 'USD', currentBalance: 5000.00, isActive: true },
    { id: '3', name: 'Credit Card', type: 'CREDIT_CARD', currency: 'USD', currentBalance: -250.00, isActive: true },
  ]

  const steps = [
    { id: 'upload', title: 'Upload', stepNumber: 1 },
    { id: 'mapping', title: 'Mapping', stepNumber: 2 },
    { id: 'review', title: 'Review', stepNumber: 3 },
    { id: 'importing', title: 'Import', stepNumber: 4 },
  ]

  const isStepActive = (stepId: string) => step === stepId
  const isStepCompleted = (stepId: string) => {
    const currentIndex = steps.findIndex(s => s.id === step)
    const stepIndex = steps.findIndex(s => s.id === stepId)
    return stepIndex < currentIndex
  }

  const applyPriorityMapping = (detectedMapping: Omit<ColumnMapping, 'account'>): ColumnMapping => {
    // Priority order: date → description → debit → credit → amount → category → recurring → notes
    const priorityOrder: (keyof Omit<ColumnMapping, 'account'>)[] = [
      'date', 'description', 'debit', 'credit', 'amount', 'category', 'recurring', 'notes'
    ]

    const usedColumns = new Set<number>()
    const finalMapping: ColumnMapping = {
      date: -1,
      description: -1,
      debit: -1,
      credit: -1,
      amount: -1,
      category: -1,
      recurring: -1,
      notes: -1,
      account: -1 // Will be set to selected account
    }

    // Assign columns based on priority order
    for (const field of priorityOrder) {
      const columnIndex = detectedMapping[field]
      if (columnIndex !== -1 && !usedColumns.has(columnIndex)) {
        finalMapping[field] = columnIndex
        usedColumns.add(columnIndex)
      }
      // If column is already used, it stays as -1 (not mapped)
    }

    return finalMapping
  }

  const getEnhancedPreview = () => {
    const lines = csvContent.split('\n').filter(line => line.trim())
    if (lines.length === 0) return ''

    // Always show header
    const preview = [lines[0]]

    // Try to find examples of both debit and credit transactions
    const dataLines = lines.slice(1)
    let debitExample = null
    let creditExample = null

    // Look for debit/credit examples if we have those columns
    if (parseResult?.detectedColumns?.debit !== undefined && parseResult?.detectedColumns?.credit !== undefined) {
      const debitCol = parseResult.detectedColumns.debit
      const creditCol = parseResult.detectedColumns.credit

      for (const line of dataLines) {
        const cells = line.split(',')
        const debitVal = parseFloat(cells[debitCol] || '0')
        const creditVal = parseFloat(cells[creditCol] || '0')

        if (!debitExample && !isNaN(debitVal) && debitVal !== 0) {
          debitExample = line
        }
        if (!creditExample && !isNaN(creditVal) && creditVal !== 0) {
          creditExample = line
        }

        if (debitExample && creditExample) break
      }
    }

    // Add examples or fallback to first few lines
    if (debitExample) preview.push(debitExample)
    if (creditExample) preview.push(creditExample)

    // Fill remaining slots with other data lines
    const remainingLines = dataLines.filter(line =>
      line !== debitExample && line !== creditExample
    ).slice(0, Math.max(0, 4 - preview.length))

    preview.push(...remainingLines)

    return preview.slice(0, 5).join('\n')
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)

    // Read file content for preview
    try {
      const content = await selectedFile.text()
      setCsvContent(content)
    } catch (error) {
      console.error('Error reading file:', error)
      alert('Error reading file. Please try again.')
    }
  }

  const handleUploadStep = async () => {
    if (!file || !selectedAccountId || !csvContent) return

    setIsLoading(true)
    setError('')

    try {
      // Parse CSV with automatic detection
      const result = await csvImportService.parseCSV(csvContent)

      if (result.transactions.length === 0) {
        setError('No valid transactions found in the CSV file')
        setIsLoading(false)
        return
      }

      setParseResult(result)

      // Create initial column mapping from detected columns with priority-based assignment
      const detectedMapping = {
        date: result.detectedColumns?.date ?? -1,
        description: result.detectedColumns?.description ?? -1,
        debit: result.detectedColumns?.debit ?? -1,
        credit: result.detectedColumns?.credit ?? -1,
        amount: result.detectedColumns?.amount ?? -1,
        category: result.detectedColumns?.category ?? -1,
        recurring: result.detectedColumns?.recurring ?? -1,
        notes: result.detectedColumns?.notes ?? -1
      }

      // Apply priority-based mapping to resolve conflicts
      const mapping = applyPriorityMapping(detectedMapping)

      setColumnMapping(mapping)

      // Set smart defaults for debit/credit interpretation based on detection
      if (result.amountDetection) {
        switch (result.amountDetection.pattern) {
          case 'inverted_debits':
            setDebitInterpretation('negative')
            setCreditInterpretation('positive')
            break
          case 'inverted_credits':
            setDebitInterpretation('positive')
            setCreditInterpretation('negative')
            break
          case 'both_inverted':
            setDebitInterpretation('negative')
            setCreditInterpretation('negative')
            break
          default:
            setDebitInterpretation('positive')
            setCreditInterpretation('positive')
        }
      }

      setStep('mapping')
    } catch (error) {
      console.error('Error parsing CSV:', error)
      setError(error instanceof Error ? error.message : 'Failed to parse CSV file')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 'upload':
        return renderUploadStep()
      case 'mapping':
        return renderMappingStep()
      case 'review':
        return renderReviewStep()
      case 'importing':
        return renderImportingStep()
      default:
        return renderUploadStep()
    }
  }

  const renderUploadStep = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Upload CSV File</h3>

      {/* Account Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Account *
        </label>
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Choose an account...</option>
          {accounts.filter(account => account.isActive).map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.type}) - ${account.currentBalance.toFixed(2)} {account.currency}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CSV File *
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {file.name} ({Math.round(file.size / 1024)} KB)
          </p>
        )}
      </div>

      {/* CSV Preview */}
      {csvContent && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 lines)</h4>
          <div className="bg-gray-50 p-3 rounded-md overflow-x-auto">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
              {csvContent.split('\n').slice(0, 5).join('\n')}
            </pre>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleUploadStep}
          disabled={!file || !selectedAccountId || isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Continue'}
        </button>
      </div>
    </div>
  )

  const renderMappingStep = () => {
    if (!parseResult || !columnMapping) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No CSV data available. Please go back and upload a file.</p>
        </div>
      )
    }

    const csvHeaders = csvContent.split('\n')[0].split(',').map(h => h.trim().replace(/"/g, ''))

    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Column Mapping</h3>
        <p className="text-sm text-gray-600 mb-4">
          Map your CSV columns to transaction fields. Required fields are marked with *.
        </p>

        {/* CSV Preview */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">CSV Preview</h4>
          <div className="bg-gray-50 p-3 rounded-md overflow-x-auto">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
              {getEnhancedPreview()}
            </pre>
          </div>
        </div>

        {/* Smart Detection Results */}
        {parseResult.amountDetection && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-3">
              💡 Format Auto-Detected
            </h4>
            <div className="bg-white rounded-md p-3 mb-4">
              <p className="text-sm font-medium text-gray-800 mb-2">
                {parseResult.amountDetection.pattern === 'inverted_credits'
                  ? '🏦 Credit Card Statement Format'
                  : parseResult.amountDetection.pattern === 'standard_debit_credit'
                  ? '🏦 Standard Bank Format'
                  : parseResult.amountDetection.pattern === 'inverted_debits'
                  ? '🏦 Bank Format (Negative Debits)'
                  : parseResult.amountDetection.pattern === 'both_inverted'
                  ? '🏦 Inverted Format (Both Negative)'
                  : '🏦 Custom Format Detected'}
              </p>
              <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-gray-700">
                <p className="font-medium mb-1">Detection Summary:</p>
                <p>• Pattern: {parseResult.amountDetection.pattern}</p>
                <p>• Confidence: {parseResult.amountDetection.confidence}</p>
                <p>• Recommendation: {parseResult.amountDetection.recommendation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Column Mapping Interface */}
        <div className="space-y-4 mb-6">
          <h4 className="text-sm font-medium text-gray-700">Column Mappings</h4>

          {[
            { key: 'date', label: 'Date', required: true },
            { key: 'description', label: 'Description', required: true },
            { key: 'debit', label: 'Debit', required: false },
            { key: 'credit', label: 'Credit', required: false },
            { key: 'amount', label: 'Amount', required: false },
            { key: 'category', label: 'Category', required: false },
            { key: 'recurring', label: 'Recurring', required: false },
            { key: 'notes', label: 'Notes', required: false }
          ].map(({ key, label, required }) => (
            <div key={key} className="flex items-center space-x-4">
              <div className="w-32 text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </div>
              <select
                value={columnMapping[key as keyof ColumnMapping] ?? -1}
                onChange={(e) => {
                  const newColumnIndex = parseInt(e.target.value)
                  setColumnMapping(prev => {
                    if (!prev) return null

                    // Create new mapping with the selected column
                    const newMapping = { ...prev, [key]: newColumnIndex }

                    // If we're mapping to a column that's already used, apply priority resolution
                    if (newColumnIndex !== -1) {
                      // Check if this column is used elsewhere
                      const conflictingField = Object.entries(newMapping).find(
                        ([otherKey, otherIndex]) =>
                          otherKey !== key && otherIndex === newColumnIndex && otherIndex !== -1
                      )?.[0]

                      if (conflictingField) {
                        // Clear the conflicting field (lower priority loses)
                        newMapping[conflictingField as keyof ColumnMapping] = -1
                      }
                    }

                    return newMapping
                  })
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={-1}>-- Not mapped --</option>
                {csvHeaders.map((header, index) => (
                  <option key={index} value={index}>
                    Column {index + 1}: {header}
                  </option>
                ))}
              </select>

              {/* Value Interpretation Dropdown for Debit/Credit */}
              {(key === 'debit' || key === 'credit') && columnMapping[key as keyof ColumnMapping] !== -1 && (
                <select
                  value={key === 'debit' ? debitInterpretation : creditInterpretation}
                  onChange={(e) => {
                    const value = e.target.value as 'positive' | 'negative'
                    if (key === 'debit') {
                      setDebitInterpretation(value)
                    } else {
                      setCreditInterpretation(value)
                    }
                  }}
                  className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="positive">Positive Values</option>
                  <option value="negative">Negative Values</option>
                </select>
              )}
            </div>
          ))}
        </div>


        {/* Parsing Errors */}
        {parseResult.errors.length > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900 mb-2">Parsing Warnings</h4>
            <p className="text-sm text-amber-800 mb-2">
              {parseResult.errors.length} row{parseResult.errors.length === 1 ? '' : 's'} had issues:
            </p>
            <ul className="text-xs text-amber-700 space-y-1 max-h-32 overflow-y-auto">
              {parseResult.errors.slice(0, 5).map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-1 h-1 bg-amber-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>{error}</span>
                </li>
              ))}
              {parseResult.errors.length > 5 && (
                <li className="text-amber-600 font-medium">
                  ... and {parseResult.errors.length - 5} more
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={() => setStep('upload')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => setStep('review')}
            disabled={columnMapping.date === -1 || columnMapping.description === -1}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  const renderReviewStep = () => {
    if (!parseResult || !columnMapping) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No transaction data available. Please go back and complete the mapping step.</p>
        </div>
      )
    }

    // Get raw CSV data for processing
    const csvLines = csvContent.split('\n').filter(line => line.trim())
    const dataLines = csvLines.slice(1) // Skip header

    // Process transactions with current mapping
    const processedTransactions = parseResult.transactions.map((transaction, index) => {
      // Calculate final amount based on debit/credit interpretation
      let finalAmount = 0
      let transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'EXPENSE'

      // Get raw CSV row for this transaction
      const rawRow = dataLines[index]?.split(',') || []

      if (columnMapping.debit !== -1 && rawRow[columnMapping.debit]) {
        const debitValue = parseFloat(rawRow[columnMapping.debit].replace(/[^0-9.-]/g, '')) || 0
        if (debitValue !== 0) {
          finalAmount = debitInterpretation === 'positive' ? -Math.abs(debitValue) : Math.abs(debitValue)
          transactionType = finalAmount > 0 ? 'INCOME' : 'EXPENSE'
        }
      }

      if (columnMapping.credit !== -1 && rawRow[columnMapping.credit]) {
        const creditValue = parseFloat(rawRow[columnMapping.credit].replace(/[^0-9.-]/g, '')) || 0
        if (creditValue !== 0) {
          finalAmount = creditInterpretation === 'positive' ? Math.abs(creditValue) : -Math.abs(creditValue)
          transactionType = finalAmount > 0 ? 'INCOME' : 'EXPENSE'
        }
      }

      if (columnMapping.amount !== -1 && transaction.amount !== undefined) {
        finalAmount = parseFloat(transaction.amount.toString()) || 0
        transactionType = finalAmount > 0 ? 'INCOME' : 'EXPENSE'
      }

      // Enhanced TRANSFER detection
      const description = transaction.description?.toLowerCase().trim() || ''
      const category = transaction.category?.toLowerCase().trim() || ''

      // Transfer keywords for description matching
      const transferKeywords = [
        'transfer', 'internal', 'move to', 'move from', 'between accounts',
        'account transfer', 'funds transfer', 'wire transfer', 'ach transfer',
        'online transfer', 'mobile transfer', 'transfer in', 'transfer out',
        'xfer', 'tfr', 'trf', 'deposit to', 'withdrawal from',
        'from savings', 'to savings', 'from checking', 'to checking',
        'from credit', 'to credit', 'balance transfer', 'payment transfer',
        'interac transfer', 'e-transfer', 'etransfer', 'auto transfer',
        'scheduled transfer', 'recurring transfer', 'sweep', 'rebalance'
      ]

      // Category-based transfer detection
      const transferCategories = [
        'transfer', 'transfers', 'internal transfer', 'account transfer',
        'balance transfer', 'funds transfer', 'money movement', 'internal'
      ]

      // Check for transfer indicators
      const isTransferByDescription = transferKeywords.some(keyword =>
        description.includes(keyword)
      )
      const isTransferByCategory = transferCategories.some(cat =>
        category.includes(cat)
      )

      // Apply transfer detection
      if (isTransferByDescription || isTransferByCategory) {
        transactionType = 'TRANSFER'
      }

      // Format date using date utilities
      const formattedDate = transaction.date ? formatDateForDisplay(transaction.date) : 'Invalid Date'

      return {
        ...transaction,
        index,
        finalAmount,
        transactionType,
        formattedDate,
        isValid: !!(transaction.date && transaction.description && finalAmount !== 0),
        isDuplicate: false // Will be calculated below
      }
    })

    // Simple duplicate detection based on date, description, and amount
    const duplicateGroups = new Map<string, number[]>()
    processedTransactions.forEach((transaction, index) => {
      if (transaction.isValid) {
        const key = `${transaction.formattedDate}-${transaction.description?.toLowerCase().trim()}-${Math.abs(transaction.finalAmount)}`
        if (!duplicateGroups.has(key)) {
          duplicateGroups.set(key, [])
        }
        duplicateGroups.get(key)!.push(index)
      }
    })

    // Mark duplicates
    duplicateGroups.forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach(index => {
          processedTransactions[index].isDuplicate = true
        })
      }
    })

    const validTransactions = processedTransactions.filter(t => t.isValid)
    const invalidTransactions = processedTransactions.filter(t => !t.isValid)
    const duplicateTransactions = processedTransactions.filter(t => t.isDuplicate)

    // Transaction type breakdowns
    const incomeTransactions = validTransactions.filter(t => t.transactionType === 'INCOME')
    const expenseTransactions = validTransactions.filter(t => t.transactionType === 'EXPENSE')
    const transferTransactions = validTransactions.filter(t => t.transactionType === 'TRANSFER')

    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Review Transactions</h3>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-900">{validTransactions.length}</div>
            <div className="text-sm text-green-700">Valid Transactions</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-900">{invalidTransactions.length}</div>
            <div className="text-sm text-red-700">Invalid Transactions</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-900">{duplicateTransactions.length}</div>
            <div className="text-sm text-yellow-700">Potential Duplicates</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-900">{processedTransactions.length}</div>
            <div className="text-sm text-blue-700">Total Rows</div>
          </div>
        </div>

        {/* Transaction Type Breakdown */}
        {validTransactions.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Transaction Type Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-green-900">{incomeTransactions.length}</div>
                    <div className="text-xs text-green-700">Income</div>
                  </div>
                  <div className="text-green-600">💰</div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-red-900">{expenseTransactions.length}</div>
                    <div className="text-xs text-red-700">Expenses</div>
                  </div>
                  <div className="text-red-600">💸</div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-blue-900">{transferTransactions.length}</div>
                    <div className="text-xs text-blue-700">Transfers</div>
                  </div>
                  <div className="text-blue-600">🔄</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warnings */}
        {(invalidTransactions.length > 0 || duplicateTransactions.length > 0) && (
          <div className="mb-6 space-y-3">
            {invalidTransactions.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">⚠️ Invalid Transactions</h4>
                <p className="text-sm text-red-800">
                  {invalidTransactions.length} transaction{invalidTransactions.length === 1 ? '' : 's'} missing required data (date, description, or amount). These will be skipped during import.
                </p>
              </div>
            )}

            {duplicateTransactions.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">🔍 Potential Duplicates</h4>
                <p className="text-sm text-yellow-800">
                  {duplicateTransactions.length} transaction{duplicateTransactions.length === 1 ? '' : 's'} appear to be duplicate{duplicateTransactions.length === 1 ? '' : 's'} based on date, description, and amount. Review carefully before importing.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Transaction Preview Table */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Transaction Preview (showing first 10)</h4>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedTransactions.slice(0, 10).map((transaction, index) => (
                  <tr key={index} className={`${
                    !transaction.isValid ? 'bg-red-50' :
                    transaction.isDuplicate ? 'bg-yellow-50' :
                    'hover:bg-gray-50'
                  }`}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {!transaction.isValid ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Invalid
                        </span>
                      ) : transaction.isDuplicate ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Duplicate?
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Valid
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {transaction.formattedDate}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate">
                      {transaction.description || 'No description'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.finalAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {transaction.finalAmount >= 0 ? '+' : ''}${Math.abs(transaction.finalAmount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.transactionType === 'INCOME' ? 'bg-green-100 text-green-800' :
                        transaction.transactionType === 'EXPENSE' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {transaction.transactionType}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500 max-w-xs truncate">
                      {transaction.category || 'Uncategorized'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {processedTransactions.length > 10 && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Showing 10 of {processedTransactions.length} transactions. All transactions will be processed during import.
            </p>
          )}
        </div>

        {/* Import Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-900 mb-2">📊 Import Summary</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• {validTransactions.length} valid transactions will be imported</p>
            <div className="ml-4 text-xs space-y-0.5">
              <p>→ {incomeTransactions.length} income transactions 💰</p>
              <p>→ {expenseTransactions.length} expense transactions 💸</p>
              {transferTransactions.length > 0 && (
                <p>→ {transferTransactions.length} transfer transactions 🔄</p>
              )}
            </div>
            <p>• {invalidTransactions.length} invalid transactions will be skipped</p>
            {duplicateTransactions.length > 0 && (
              <p>• {duplicateTransactions.length} potential duplicates detected - review recommended</p>
            )}
            <p>• Target account: {accounts.find(a => a.id === selectedAccountId)?.name}</p>
            {transferTransactions.length > 0 && (
              <div className="mt-2 p-2 bg-blue-100 rounded text-xs">
                <p className="font-medium text-blue-900">💡 Transfer Detection Active</p>
                <p>Detected {transferTransactions.length} transfer{transferTransactions.length === 1 ? '' : 's'} based on description/category keywords</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setStep('mapping')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Mapping
          </button>
          <button
            onClick={() => setStep('importing')}
            disabled={validTransactions.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import {validTransactions.length} Transaction{validTransactions.length === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    )
  }

  const renderImportingStep = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Importing Transactions</h3>

      <div className="text-center py-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-green-900 mb-2">Import Step</h4>
          <p className="text-sm text-green-800">
            Transaction import functionality will be implemented in the next phase.
          </p>
        </div>

        <button
          onClick={() => router.push('/transactions')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700"
        >
          View Transactions
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/transactions')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            ← Back to Transactions
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Import Transactions</h1>
          <p className="mt-2 text-sm text-gray-600">
            Import transactions from your bank or financial institution CSV files.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((stepInfo, index) => (
              <ProgressStep
                key={stepInfo.id}
                id={stepInfo.id}
                title={stepInfo.title}
                stepNumber={stepInfo.stepNumber}
                isActive={isStepActive(stepInfo.id)}
                isCompleted={isStepCompleted(stepInfo.id)}
                isLast={index === steps.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {renderStepContent()}
        </div>
      </div>
    </div>
  )
}
