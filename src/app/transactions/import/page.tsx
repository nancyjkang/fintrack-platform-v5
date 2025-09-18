'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { csvImportService } from '@/lib/services/csv-import'
import type { ParseResult, ColumnMapping } from '@/lib/types/csv-import.types'
import { formatDateForDisplay } from '@/lib/utils/date-utils'
import AppLayout from '@/components/layout/AppLayout'
import { api } from '@/lib/client/api'

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
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<{
    imported: number
    skipped: number
    errors: string[]
    duplicatesSkipped: number
  } | null>(null)
  const [existingTransactions, setExistingTransactions] = useState<Array<{
    id: number
    date: string
    description: string
    amount: number
  }>>([])
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false)
  const [accounts, setAccounts] = useState<Array<{
    id: number
    name: string
    type: string
    balance: number
    is_active: boolean
  }>>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch existing transactions for duplicate checking
  const fetchExistingTransactions = async () => {
    if (!selectedAccountId || !csvContent || !columnMapping) return

    setIsCheckingDuplicates(true)
    try {
      // Get CSV data for date range calculation
      const csvLines = csvContent.split('\n').filter(line => line.trim())
      const dataLines = csvLines.slice(1) // Skip header

      if (dataLines.length === 0) {
        console.warn('No data lines found in CSV')
        setExistingTransactions([])
        return
      }

      // Calculate date range from the CSV data
      const csvDates = dataLines.map(line => {
        const cells = line.split(',')
        const dateStr = cells[columnMapping.date]
        return new Date(dateStr)
      }).filter(date => !isNaN(date.getTime()))

      if (csvDates.length === 0) {
        console.warn('No valid dates found in CSV data')
        setExistingTransactions([])
        return
      }

      const minDate = new Date(Math.min(...csvDates.map(d => d.getTime())))
      const maxDate = new Date(Math.max(...csvDates.map(d => d.getTime())))

      // Add a small buffer (1 day before and after) to catch edge cases
      const dateFrom = new Date(minDate)
      dateFrom.setDate(dateFrom.getDate() - 1)
      const dateTo = new Date(maxDate)
      dateTo.setDate(dateTo.getDate() + 1)

      const dateFromStr = dateFrom.toISOString().split('T')[0]
      const dateToStr = dateTo.toISOString().split('T')[0]

      console.log('🔍 Fetching transactions in date range:', {
        accountId: selectedAccountId,
        dateFrom: dateFromStr,
        dateTo: dateToStr,
        csvDateRange: {
          min: minDate.toISOString().split('T')[0],
          max: maxDate.toISOString().split('T')[0]
        }
      })

      // Fetch ALL transactions within the CSV date range for complete duplicate detection
      let allTransactions: any[] = []
      let currentPage = 1
      let totalPages = 1

      console.log('🔍 Starting to fetch all existing transactions for duplicate check...')

      // Fetch all pages of transactions using the authenticated API client
      do {
        try {
          const response = await api.getTransactions({
            account_id: parseInt(selectedAccountId),
            date_from: dateFromStr,
            date_to: dateToStr,
            limit: 1000,
            page: currentPage
          })

          if (response.success && response.data) {
            const transactions = response.data.transactions || []
            const pagination = response.data.pagination || {}

            allTransactions = allTransactions.concat(transactions)
            totalPages = pagination.totalPages || 1

            console.log(`🔍 Fetched page ${currentPage}/${totalPages}:`, {
              pageTransactions: transactions.length,
              totalSoFar: allTransactions.length,
              totalExpected: pagination.total
            })

            currentPage++
          } else {
            console.error('Failed to fetch existing transactions:', response.error || 'Unknown error')
            break
          }
        } catch (error) {
          console.error(`Error fetching page ${currentPage}:`, error)
          break
        }
      } while (currentPage <= totalPages)

      console.log('🔍 Completed fetching all existing transactions:', {
        accountId: selectedAccountId,
        totalCount: allTransactions.length,
        dateRange: `${dateFromStr} to ${dateToStr}`,
        pagesFetched: currentPage - 1,
        sampleTransactions: allTransactions.slice(0, 5).map(t => ({
          date: formatDateForDisplay(t.date),
          description: t.description,
          amount: t.amount
        }))
      })

      setExistingTransactions(allTransactions)
    } catch (error) {
      console.error('Error fetching existing transactions:', error)
    } finally {
      setIsCheckingDuplicates(false)
    }
  }

  // Fetch accounts from API
  const fetchAccounts = async () => {
    setIsLoadingAccounts(true)
    try {
      const response = await api.getAccounts({ is_active: true })
      if (response.success && response.data) {
        setAccounts(response.data)
      } else {
        console.error('Failed to fetch accounts:', response.error)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setIsLoadingAccounts(false)
    }
  }

  // Load accounts on component mount
  useEffect(() => {
    fetchAccounts()
  }, [])

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

  const handleImportTransactions = async () => {
    if (!parseResult || !columnMapping) return

    setIsLoading(true)
    setError('')
    setImportProgress(0)

    try {
      // Get raw CSV data for processing
      const csvLines = csvContent.split('\n').filter(line => line.trim())
      const dataLines = csvLines.slice(1) // Skip header

      // Process transactions for import
      const transactionsToImport = parseResult.transactions
        .map((transaction, index) => {
          // Get raw CSV row for this transaction
          const rawRow = dataLines[index]?.split(',') || []

          // Calculate final amount based on debit/credit interpretation
          let finalAmount = 0

          if (columnMapping.debit !== -1 && rawRow[columnMapping.debit]) {
            const debitValue = parseFloat(rawRow[columnMapping.debit].replace(/[^0-9.-]/g, '')) || 0
            if (debitValue !== 0) {
              finalAmount = debitInterpretation === 'positive' ? -Math.abs(debitValue) : Math.abs(debitValue)
            }
          }

          if (columnMapping.credit !== -1 && rawRow[columnMapping.credit]) {
            const creditValue = parseFloat(rawRow[columnMapping.credit].replace(/[^0-9.-]/g, '')) || 0
            if (creditValue !== 0) {
              finalAmount = creditInterpretation === 'positive' ? Math.abs(creditValue) : -Math.abs(creditValue)
            }
          }

          if (columnMapping.amount !== -1 && transaction.amount !== undefined) {
            finalAmount = parseFloat(transaction.amount.toString()) || 0
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

          // Determine transaction type
          let transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'EXPENSE'
          if (isTransferByDescription || isTransferByCategory) {
            transactionType = 'TRANSFER'
          } else {
            transactionType = finalAmount > 0 ? 'INCOME' : 'EXPENSE'
          }

          // Only include valid transactions
          const isValid = !!(transaction.date && transaction.description && finalAmount !== 0)

          return isValid ? {
            accountId: selectedAccountId,
            date: transaction.date,
            description: transaction.description,
            amount: finalAmount,
            type: transactionType,
            category: transaction.category,
            notes: transaction.notes,
            isRecurring: transaction.recurring || false
          } : null
        })
        .filter(t => t !== null)

      // Simulate progress updates

      setImportProgress(10)

      // Call import API with authentication
      const accessToken = api.getAccessToken()
      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          transactions: transactionsToImport,
          skipDuplicates: true
        })
      })

      setImportProgress(50)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Import failed')
      }

      const result = await response.json()
      setImportResult(result.data)
      setImportProgress(100)

      // Move to final step after a brief delay
      setTimeout(() => {
        setStep('importing')
      }, 500)

    } catch (error) {
      console.error('Error importing transactions:', error)
      setError(error instanceof Error ? error.message : 'Failed to import transactions')
    } finally {
      setIsLoading(false)
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
          disabled={isLoadingAccounts}
        >
          <option value="">
            {isLoadingAccounts ? 'Loading accounts...' : 'Choose an account...'}
          </option>
          {accounts.filter(account => account.is_active).map((account) => (
            <option key={account.id} value={account.id.toString()}>
              {account.name} ({account.type}) - ${typeof account.balance === 'number' ? account.balance.toFixed(2) : parseFloat(account.balance || '0').toFixed(2)}
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
            onClick={async () => {
              await fetchExistingTransactions()
              setStep('review')
            }}
            disabled={columnMapping.date === -1 || columnMapping.description === -1 || isCheckingDuplicates}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCheckingDuplicates ? 'Checking for duplicates...' : 'Continue'}
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

    // Enhanced duplicate detection - check against existing transactions and within CSV
    const duplicateGroups = new Map<string, number[]>()

    processedTransactions.forEach((transaction, index) => {
      if (transaction.isValid) {
        const key = `${transaction.formattedDate}-${transaction.description?.toLowerCase().trim()}-${Math.abs(transaction.finalAmount)}`

        // Check against existing transactions in database
        const existingDuplicate = existingTransactions.some(existing => {
          const existingDate = formatDateForDisplay(existing.date)
          const existingDescription = existing.description?.toLowerCase().trim() || ''
          const existingAmount = Math.abs(existing.amount)

          return existingDate === transaction.formattedDate &&
                 existingDescription === transaction.description?.toLowerCase().trim() &&
                 existingAmount === Math.abs(transaction.finalAmount)
        })

        if (existingDuplicate) {
          processedTransactions[index].isDuplicate = true
        }

        // Also check for duplicates within the current CSV
        if (!duplicateGroups.has(key)) {
          duplicateGroups.set(key, [])
        }
        duplicateGroups.get(key)!.push(index)
      }
    })

    // Mark duplicates within CSV
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
        {/* Target Account Info */}

        {/* Loading indicator for duplicate checking */}
        {isCheckingDuplicates && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="animate-spin w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-medium text-yellow-800">Checking for duplicate transactions...</span>
            </div>
          </div>
        )}

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
                  <div className="text-green-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-red-900">{expenseTransactions.length}</div>
                    <div className="text-xs text-red-700">Expenses</div>
                  </div>
                  <div className="text-red-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-blue-900">{transferTransactions.length}</div>
                    <div className="text-xs text-blue-700">Transfers</div>
                  </div>
                  <div className="text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
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
          <h4 className="text-sm font-medium text-gray-700 mb-3">Transaction Preview</h4>
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
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurring</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedTransactions.map((transaction, index) => (
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
                          Duplicate
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
                    <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate" title={transaction.description || 'No description'}>
                      {transaction.description || 'No description'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.finalAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {transaction.finalAmount >= 0 ? '+' : '-'}${Math.abs(transaction.finalAmount).toFixed(2)}
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
                    <td className="px-3 py-2 text-sm text-gray-500 max-w-xs truncate" title={transaction.category || 'Uncategorized'}>
                      {transaction.category || 'Uncategorized'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.recurring === 'true' || transaction.recurring === true ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.recurring === 'true' || transaction.recurring === true ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {processedTransactions.length > 0 && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Showing all {processedTransactions.length} transactions that will be processed during import.
            </p>
          )}
        </div>

        {/* Import Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-900 mb-2">📊 Import Summary</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <span className="font-semibold">Target account:</span> {accounts.find(a => a.id.toString() === selectedAccountId)?.name}</p>
            <p>• {validTransactions.length} valid transactions will be imported</p>
            <div className="ml-4 text-xs space-y-1">
              <p className="flex items-center gap-2">
                <span>→ {incomeTransactions.length} income transactions</span>
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </p>
              <p className="flex items-center gap-2">
                <span>→ {expenseTransactions.length} expense transactions</span>
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              </p>
              {transferTransactions.length > 0 && (
                <p className="flex items-center gap-2">
                  <span>→ {transferTransactions.length} transfer transactions</span>
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </p>
              )}
            </div>
            <p>• {invalidTransactions.length} invalid transactions will be skipped</p>
            {duplicateTransactions.length > 0 && (
              <p>• {duplicateTransactions.length} duplicate transactions detected - will be automatically skipped</p>
            )}
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
            onClick={handleImportTransactions}
            disabled={validTransactions.length === 0 || isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing... ({importProgress}%)
              </>
            ) : (
              `Import ${validTransactions.filter(t => !t.isDuplicate).length} Transaction${validTransactions.filter(t => !t.isDuplicate).length === 1 ? '' : 's'}`
            )}
          </button>
        </div>
      </div>
    )
  }

  const renderImportingStep = () => {
    if (isLoading) {
      return (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Importing Transactions</h3>

          <div className="text-center py-8">
            <div className="mb-6">
              <svg className="animate-spin mx-auto h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>

            <h4 className="text-lg font-medium text-gray-900 mb-2">Processing Your Transactions</h4>
            <p className="text-sm text-gray-600 mb-4">Please wait while we import your transactions...</p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{importProgress}% Complete</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Import Failed</h3>

          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="text-red-600 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h4 className="font-semibold text-red-900 mb-2">Import Error</h4>
              <p className="text-sm text-red-800 mb-4">{error}</p>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setStep('review')}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg shadow-sm text-red-700 bg-white hover:bg-red-50"
                >
                  Back to Review
                </button>
                <button
                  onClick={() => {
                    setError('')
                    setStep('upload')
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700"
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (importResult) {
      return (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Import Complete</h3>

          <div className="text-center py-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="text-green-600 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h4 className="font-semibold text-green-900 mb-4">Import Successful!</h4>

              {/* Import Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-900">{importResult.imported}</div>
                  <div className="text-sm text-green-700">Imported</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-900">{importResult.duplicatesSkipped}</div>
                  <div className="text-sm text-yellow-700">Duplicates Skipped</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="text-2xl font-bold text-red-900">{importResult.skipped}</div>
                  <div className="text-sm text-red-700">Errors/Skipped</div>
                </div>
              </div>

              {/* Error Details */}
              {importResult.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                  <h5 className="font-medium text-yellow-900 mb-2">Import Warnings:</h5>
                  <ul className="text-sm text-yellow-800 space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-1 h-1 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        <span>{error}</span>
                      </li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li className="text-yellow-600 font-medium">
                        ... and {importResult.errors.length - 10} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => router.push('/transactions')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  View Transactions
                </button>
                <button
                  onClick={() => {
                    // Reset all state for new import
                    setStep('upload')
                    setFile(null)
                    setSelectedAccountId('')
                    setCsvContent('')
                    setParseResult(null)
                    setColumnMapping(null)
                    setImportResult(null)
                    setError('')
                    setImportProgress(0)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  Import Another File
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Fallback (shouldn't reach here)
    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Import Status Unknown</h3>
        <div className="text-center py-8">
          <button
            onClick={() => setStep('upload')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
    </AppLayout>
  )
}
