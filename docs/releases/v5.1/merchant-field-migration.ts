/**
 * v5.1 Merchant Field Migration Script
 * 
 * This TypeScript script provides merchant parsing functionality
 * that can be integrated into the application for ongoing merchant extraction
 */

/**
 * Extract merchant name from transaction description
 * This function replicates the SQL function logic in TypeScript
 */
export function extractMerchantName(description: string | null): string | null {
  // Return null for empty descriptions
  if (!description || description.trim() === '') {
    return null;
  }

  let merchantName = description.trim();

  // Remove common transaction prefixes
  merchantName = merchantName.replace(/^(PURCHASE|PAYMENT|DEBIT|POS|ATM|CHECK|DEPOSIT|WITHDRAWAL|TRANSFER|ACH|WIRE)\s+/i, '');
  
  // Remove common card processor prefixes
  merchantName = merchantName.replace(/^(VISA|MC|MASTERCARD|AMEX|DISCOVER)\s+/i, '');
  
  // Remove dates at the end (MM/DD, MM/DD/YY, MM/DD/YYYY)
  merchantName = merchantName.replace(/\s+\d{1,2}\/\d{1,2}(\/\d{2,4})?\s*$/g, '');
  
  // Remove reference numbers at the end (#1234, REF#1234, etc.)
  merchantName = merchantName.replace(/\s+(#|REF#?|REFERENCE#?)\d+\s*$/i, '');
  
  // Remove transaction IDs and confirmation numbers
  merchantName = merchantName.replace(/\s+[A-Z0-9]{8,}\s*$/g, '');
  
  // Remove store numbers (#1234, STORE #1234, etc.)
  merchantName = merchantName.replace(/\s+(STORE\s+)?#\d+/i, '');
  
  // Remove location codes at the end
  merchantName = merchantName.replace(/\s+[A-Z]{2,3}\d*\s*$/g, '');
  
  // Remove common suffixes
  merchantName = merchantName.replace(/\s+(INC|LLC|CORP|CO|LTD|LP)\s*$/i, '');
  
  // Clean up extra whitespace
  merchantName = merchantName.replace(/\s+/g, ' ').trim();
  
  // Convert to title case for consistency
  merchantName = toTitleCase(merchantName);
  
  // Handle special cases for common merchants
  if (/^WAL.*MART/i.test(merchantName)) {
    merchantName = 'Walmart';
  } else if (/^TARGET/i.test(merchantName)) {
    merchantName = 'Target';
  } else if (/^AMAZON/i.test(merchantName)) {
    merchantName = 'Amazon';
  } else if (/^STARBUCKS/i.test(merchantName)) {
    merchantName = 'Starbucks';
  } else if (/^(MCD|MCDONALDS)/i.test(merchantName)) {
    merchantName = 'McDonald\'s';
  } else if (/^SHELL/i.test(merchantName)) {
    merchantName = 'Shell';
  } else if (/^CHEVRON/i.test(merchantName)) {
    merchantName = 'Chevron';
  } else if (/^EXXON/i.test(merchantName)) {
    merchantName = 'ExxonMobil';
  } else if (/^SAFEWAY/i.test(merchantName)) {
    merchantName = 'Safeway';
  } else if (/^KROGER/i.test(merchantName)) {
    merchantName = 'Kroger';
  }
  
  // Return null if the result is too short or generic
  if (merchantName.length < 2 || ['', 'N/A', 'UNKNOWN', 'MISC', 'OTHER'].includes(merchantName.toUpperCase())) {
    return null;
  }
  
  return merchantName;
}

/**
 * Convert string to title case
 */
function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Batch update existing transactions with merchant names
 * This can be run as a one-time migration or for periodic cleanup
 */
export async function populateMerchantFields(
  prisma: any, // PrismaClient type
  batchSize: number = 1000,
  onProgress?: (processed: number, total: number) => void
): Promise<{ totalProcessed: number; merchantsFound: number }> {
  console.log('Starting merchant field population...');
  
  // Get total count of transactions without merchant field
  const totalTransactions = await prisma.transaction.count({
    where: { merchant: null }
  });
  
  console.log(`Found ${totalTransactions} transactions to process`);
  
  let totalProcessed = 0;
  let merchantsFound = 0;
  let skip = 0;
  
  while (skip < totalTransactions) {
    // Get batch of transactions
    const transactions = await prisma.transaction.findMany({
      where: { merchant: null },
      select: { id: true, description: true },
      skip,
      take: batchSize
    });
    
    if (transactions.length === 0) break;
    
    // Process each transaction in the batch
    const updates = transactions.map(transaction => {
      const merchant = extractMerchantName(transaction.description);
      if (merchant) merchantsFound++;
      
      return prisma.transaction.update({
        where: { id: transaction.id },
        data: { merchant }
      });
    });
    
    // Execute batch updates
    await Promise.all(updates);
    
    totalProcessed += transactions.length;
    skip += batchSize;
    
    // Report progress
    if (onProgress) {
      onProgress(totalProcessed, totalTransactions);
    }
    
    console.log(`Processed ${totalProcessed}/${totalTransactions} transactions`);
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`Migration completed. Processed: ${totalProcessed}, Merchants found: ${merchantsFound}`);
  
  return { totalProcessed, merchantsFound };
}

/**
 * Get merchant statistics after migration
 */
export async function getMerchantStatistics(prisma: any) {
  const stats = await prisma.transaction.aggregate({
    _count: {
      id: true,
      merchant: true
    }
  });
  
  const topMerchants = await prisma.transaction.groupBy({
    by: ['merchant'],
    where: { merchant: { not: null } },
    _count: { merchant: true },
    _sum: { amount: true },
    orderBy: { _count: { merchant: 'desc' } },
    take: 20
  });
  
  const coveragePercent = stats._count.merchant / stats._count.id * 100;
  
  return {
    totalTransactions: stats._count.id,
    transactionsWithMerchants: stats._count.merchant,
    coveragePercent: Math.round(coveragePercent * 100) / 100,
    topMerchants: topMerchants.map(m => ({
      merchant: m.merchant,
      transactionCount: m._count.merchant,
      totalAmount: Number(m._sum.amount || 0)
    }))
  };
}

/**
 * Example usage in a migration script or API endpoint
 */
export async function runMerchantMigration(prisma: any) {
  try {
    console.log('=== Merchant Field Migration v5.1 ===');
    
    // Run the migration
    const result = await populateMerchantFields(
      prisma,
      1000,
      (processed, total) => {
        const percent = Math.round((processed / total) * 100);
        console.log(`Progress: ${percent}% (${processed}/${total})`);
      }
    );
    
    // Get statistics
    const stats = await getMerchantStatistics(prisma);
    
    console.log('\n=== Migration Results ===');
    console.log(`Total transactions processed: ${result.totalProcessed}`);
    console.log(`Merchants found: ${result.merchantsFound}`);
    console.log(`Coverage: ${stats.coveragePercent}%`);
    console.log('\nTop merchants:');
    stats.topMerchants.slice(0, 10).forEach((merchant, index) => {
      console.log(`${index + 1}. ${merchant.merchant}: ${merchant.transactionCount} transactions`);
    });
    
    return stats;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Export test cases for merchant parsing
export const testCases = [
  {
    description: 'PURCHASE WALMART SUPERCENTER #1234 ANYTOWN CA 12/15',
    expected: 'Walmart'
  },
  {
    description: 'POS DEBIT STARBUCKS STORE #5678 SEATTLE WA',
    expected: 'Starbucks'
  },
  {
    description: 'AMAZON.COM AMZN.COM/BILL WA REF#ABC123456',
    expected: 'Amazon'
  },
  {
    description: 'TARGET T-1234 MINNEAPOLIS MN',
    expected: 'Target'
  },
  {
    description: 'SHELL OIL 12345 HOUSTON TX 01/20/2024',
    expected: 'Shell'
  },
  {
    description: 'MCDONALD\'S #9876 CHICAGO IL',
    expected: 'McDonald\'s'
  },
  {
    description: 'SAFEWAY STORE 1111 SAN FRANCISCO CA',
    expected: 'Safeway'
  }
];

/**
 * Test the merchant parsing function
 */
export function testMerchantParsing(): void {
  console.log('=== Testing Merchant Parsing ===');
  
  testCases.forEach((testCase, index) => {
    const result = extractMerchantName(testCase.description);
    const passed = result === testCase.expected;
    
    console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Input: "${testCase.description}"`);
    console.log(`  Expected: "${testCase.expected}"`);
    console.log(`  Got: "${result}"`);
    console.log('');
  });
}

