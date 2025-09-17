/**
 * Currency formatting utilities
 */

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

/**
 * Parse a currency string to number
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols and parse
  const cleaned = currencyString.replace(/[^-\d.]/g, '')
  return parseFloat(cleaned) || 0
}

/**
 * Format currency for input fields (no currency symbol)
 */
export function formatCurrencyForInput(amount: number): string {
  return amount.toFixed(2)
}
