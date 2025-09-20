/**
 * Merchant parsing utility for extracting merchant names from transaction descriptions
 * This is the TypeScript implementation that matches the SQL function in the migration
 */

/**
 * Extract merchant name from transaction description
 * This function replicates the SQL function logic for consistency
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

  // Remove patterns like "United 016245900041united.com Txna..." (transaction reference codes)
  merchantName = merchantName.replace(/^United\s+\d{12,}united\.com\s+Txn.*$/i, '');

  // Remove other common transaction reference patterns
  merchantName = merchantName.replace(/^(United|Ref|Reference)\s+\d{10,}.*$/i, '');

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
  // eslint-disable-next-line @typescript-eslint/ban-types
  prisma: { transaction: { count: Function; findMany: Function; updateMany: Function; update: Function } }, // PrismaClient type
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
export async function getMerchantStatistics(
  // eslint-disable-next-line @typescript-eslint/ban-types
  prisma: { transaction: { aggregate: Function; count: Function; groupBy: Function } }
) {
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
 * Test cases for merchant parsing validation
 */
export const merchantTestCases = [
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
  },
  {
    description: 'CHEVRON #12345 LOS ANGELES CA',
    expected: 'Chevron'
  },
  {
    description: 'EXXON MOBIL STATION 98765 DALLAS TX',
    expected: 'ExxonMobil'
  },
  {
    description: 'KROGER GROCERY STORE ATLANTA GA',
    expected: 'Kroger'
  }
];

/**
 * Test the merchant parsing function against known test cases
 */
export function testMerchantParsing(): { passed: number; failed: number; results: Array<{ test: string; passed: boolean; expected: string; actual: string | null }> } {
  const results = merchantTestCases.map((testCase, index) => {
    const result = extractMerchantName(testCase.description);
    const passed = result === testCase.expected;

    return {
      test: `Test ${index + 1}`,
      passed,
      expected: testCase.expected,
      actual: result,
      description: testCase.description
    };
  });

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return { passed, failed, results };
}
