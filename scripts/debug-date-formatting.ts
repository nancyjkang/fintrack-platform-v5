#!/usr/bin/env tsx

/**
 * Debug date formatting issue in trends page
 */

import { parseAndConvertToUTC, getCurrentUTCDate } from '../src/lib/utils/date-utils'

function debugDateFormatting() {
  console.log('🔍 Debugging date formatting issue...\n')

  // Test the problematic date
  const testDates = [
    '2024-12-01',
    '2024-11-01',
    '2025-01-01',
    '2025-02-01'
  ]

  testDates.forEach(dateString => {
    console.log(`📅 Testing date: ${dateString}`)

    try {
      // Test parseAndConvertToUTC
      const parsedDate = parseAndConvertToUTC(dateString)
      console.log(`   Parsed UTC: ${parsedDate.toISOString()}`)
      console.log(`   Local: ${parsedDate.toString()}`)

      // Test the formatting logic from trends page
      const monthShortYear = parsedDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      console.log(`   Formatted (month short, year 2-digit): "${monthShortYear}"`)

      // Test different locale options
      const monthLong = parsedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      console.log(`   Formatted (month long, year full): "${monthLong}"`)

      // Check month and year separately
      console.log(`   Month: ${parsedDate.getMonth() + 1} (${parsedDate.toLocaleDateString('en-US', { month: 'short' })})`)
      console.log(`   Year: ${parsedDate.getFullYear()}`)

    } catch (error) {
      console.error(`   ❌ Error parsing ${dateString}:`, error)
    }

    console.log('')
  })

  // Test timezone issues
  console.log('🌍 Timezone info:')
  console.log(`   Current timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
  console.log(`   UTC offset: ${getCurrentUTCDate().getTimezoneOffset()} minutes`)
}

// Run the debug
debugDateFormatting()
