#!/usr/bin/env node

/**
 * Test script to validate consistency between balance-history and transactions-with-balances endpoints
 *
 * This script will:
 * 1. Call both API endpoints with the same parameters
 * 2. Compare the balance calculations to ensure consistency
 * 3. Report any discrepancies
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ACCOUNT_ID = process.env.TEST_ACCOUNT_ID || '5'; // Default to account 5 from seed data
const START_DATE = process.env.START_DATE || '2025-08-01';
const END_DATE = process.env.END_DATE || '2025-09-16';
const AUTH_TOKEN = process.env.AUTH_TOKEN; // JWT token for authentication

if (!AUTH_TOKEN) {
  console.error('❌ AUTH_TOKEN environment variable is required');
  console.log('Usage: AUTH_TOKEN=your_jwt_token node test-balance-consistency.js');
  process.exit(1);
}

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    protocol.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function testConsistency() {
  console.log('🔍 Testing Balance Consistency Between Endpoints');
  console.log('================================================');
  console.log(`Account ID: ${ACCOUNT_ID}`);
  console.log(`Date Range: ${START_DATE} to ${END_DATE}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');

  try {
    // 1. Fetch data from both endpoints
    console.log('📡 Fetching data from both endpoints...');

    const balanceHistoryUrl = `${BASE_URL}/api/accounts/${ACCOUNT_ID}/balance-history?startDate=${START_DATE}&endDate=${END_DATE}`;
    const transactionsUrl = `${BASE_URL}/api/accounts/${ACCOUNT_ID}/transactions-with-balances?startDate=${START_DATE}&endDate=${END_DATE}&sortOrder=asc`;

    console.log(`  - Balance History: ${balanceHistoryUrl}`);
    console.log(`  - Transactions: ${transactionsUrl}`);
    console.log('');

    const [balanceHistoryResponse, transactionsResponse] = await Promise.all([
      makeRequest(balanceHistoryUrl),
      makeRequest(transactionsUrl)
    ]);

    // 2. Check if both requests were successful
    if (!balanceHistoryResponse.success) {
      throw new Error(`Balance history API failed: ${balanceHistoryResponse.error}`);
    }

    if (!transactionsResponse.success) {
      throw new Error(`Transactions API failed: ${transactionsResponse.error}`);
    }

    const balanceHistory = balanceHistoryResponse.data || [];
    const transactions = transactionsResponse.data.transactions || [];

    console.log(`✅ Successfully fetched data:`);
    console.log(`  - Balance History entries: ${balanceHistory.length}`);
    console.log(`  - Transactions: ${transactions.length}`);
    console.log('');

    // 3. Create a map of daily balances from balance history
    const dailyBalances = new Map();
    balanceHistory.forEach(entry => {
      dailyBalances.set(entry.date, entry.endingBalance);
    });

    // 4. Create a map of final daily balances from transactions
    const transactionDailyBalances = new Map();
    transactions.forEach(transaction => {
      const date = transaction.date.split('T')[0]; // Extract YYYY-MM-DD
      // Keep the latest balance for each day (assuming transactions are sorted)
      transactionDailyBalances.set(date, transaction.balance);
    });

    // 5. Compare the balances
    console.log('🔍 Comparing daily ending balances...');
    let consistencyErrors = 0;
    let totalComparisons = 0;

    // Check each date in balance history
    for (const [date, expectedBalance] of dailyBalances) {
      const actualBalance = transactionDailyBalances.get(date);
      totalComparisons++;

      if (actualBalance === undefined) {
        console.log(`⚠️  Date ${date}: No transactions found (expected balance: $${expectedBalance})`);
        continue;
      }

      const difference = Math.abs(expectedBalance - actualBalance);
      if (difference > 0.01) { // Allow for small floating point differences
        console.log(`❌ Date ${date}: Balance mismatch!`);
        console.log(`   Expected (balance-history): $${expectedBalance}`);
        console.log(`   Actual (transactions): $${actualBalance}`);
        console.log(`   Difference: $${difference}`);
        consistencyErrors++;
      } else {
        console.log(`✅ Date ${date}: Consistent balance $${expectedBalance}`);
      }
    }

    // 6. Check for extra dates in transactions
    for (const [date, balance] of transactionDailyBalances) {
      if (!dailyBalances.has(date)) {
        console.log(`⚠️  Date ${date}: Found in transactions ($${balance}) but not in balance history`);
      }
    }

    // 7. Summary
    console.log('');
    console.log('📊 Consistency Test Results');
    console.log('===========================');
    console.log(`Total comparisons: ${totalComparisons}`);
    console.log(`Consistency errors: ${consistencyErrors}`);
    console.log(`Success rate: ${totalComparisons > 0 ? ((totalComparisons - consistencyErrors) / totalComparisons * 100).toFixed(1) : 0}%`);

    if (consistencyErrors === 0) {
      console.log('🎉 All balances are consistent! Both endpoints are using the same calculation logic.');
    } else {
      console.log('⚠️  Inconsistencies found. This may indicate different calculation methods or data sources.');
    }

    // 8. Show calculation methods used
    console.log('');
    console.log('🔧 Calculation Methods:');
    console.log(`  - Balance History: ${balanceHistoryResponse.data?.[0]?.calculationMethod || 'unknown'}`);
    console.log(`  - Transactions: ${transactionsResponse.data.calculationMethod || 'unknown'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testConsistency().catch(console.error);

