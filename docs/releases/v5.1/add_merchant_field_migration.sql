-- =====================================================
-- v5.1 Database Migration: Add Merchant Field
-- =====================================================
-- This migration adds merchant fields to transactions and financial_cube tables
-- and includes a script to parse existing transaction descriptions

-- Migration: Add merchant field to transactions table
-- =====================================================

BEGIN;

-- Add merchant field to transactions table
ALTER TABLE transactions ADD COLUMN merchant VARCHAR(255);

-- Add merchant_name field to financial_cube table
ALTER TABLE financial_cube ADD COLUMN merchant_name VARCHAR(255);

-- Add index for merchant field performance
CREATE INDEX IF NOT EXISTS "transactions_tenant_id_merchant_idx"
ON "transactions"("tenant_id", "merchant");

-- Add index for financial cube merchant queries
CREATE INDEX IF NOT EXISTS "financial_cube_tenant_merchant_period_idx"
ON "financial_cube"("tenant_id", "merchant_name", "period_start");

COMMIT;

-- =====================================================
-- Merchant Parsing Function
-- =====================================================
-- Function to extract merchant name from transaction description

CREATE OR REPLACE FUNCTION extract_merchant_name(description TEXT)
RETURNS TEXT AS $$
DECLARE
    merchant_name TEXT;
BEGIN
    -- Return null for empty descriptions
    IF description IS NULL OR TRIM(description) = '' THEN
        RETURN NULL;
    END IF;

    -- Start with the original description
    merchant_name := TRIM(description);

    -- Remove common transaction prefixes
    merchant_name := REGEXP_REPLACE(merchant_name, '^(PURCHASE|PAYMENT|DEBIT|POS|ATM|CHECK|DEPOSIT|WITHDRAWAL|TRANSFER|ACH|WIRE)\s+', '', 'i');

    -- Remove common card processor prefixes
    merchant_name := REGEXP_REPLACE(merchant_name, '^(VISA|MC|MASTERCARD|AMEX|DISCOVER)\s+', '', 'i');

    -- Remove dates at the end (MM/DD, MM/DD/YY, MM/DD/YYYY)
    merchant_name := REGEXP_REPLACE(merchant_name, '\s+\d{1,2}/\d{1,2}(/\d{2,4})?\s*$', '', 'g');

    -- Remove reference numbers at the end (#1234, REF#1234, etc.)
    merchant_name := REGEXP_REPLACE(merchant_name, '\s+(#|REF#?|REFERENCE#?)\d+\s*$', '', 'i');

    -- Remove transaction IDs and confirmation numbers
    merchant_name := REGEXP_REPLACE(merchant_name, '\s+[A-Z0-9]{8,}\s*$', '', 'g');

    -- Remove patterns like "United 016245900041united.com Txna..." (transaction reference codes)
    merchant_name := REGEXP_REPLACE(merchant_name, '^United\s+\d{12,}united\.com\s+Txn.*$', '', 'i');

    -- Remove other common transaction reference patterns
    merchant_name := REGEXP_REPLACE(merchant_name, '^(United|Ref|Reference)\s+\d{10,}.*$', '', 'i');

    -- Remove store numbers (#1234, STORE #1234, etc.)
    merchant_name := REGEXP_REPLACE(merchant_name, '\s+(STORE\s+)?#\d+', '', 'i');

    -- Remove location codes at the end
    merchant_name := REGEXP_REPLACE(merchant_name, '\s+[A-Z]{2,3}\d*\s*$', '', 'g');

    -- Remove common suffixes
    merchant_name := REGEXP_REPLACE(merchant_name, '\s+(INC|LLC|CORP|CO|LTD|LP)\s*$', '', 'i');

    -- Clean up extra whitespace
    merchant_name := REGEXP_REPLACE(merchant_name, '\s+', ' ', 'g');
    merchant_name := TRIM(merchant_name);

    -- Convert to title case for consistency
    merchant_name := INITCAP(merchant_name);

    -- Handle special cases for common merchants
    -- Walmart variations
    IF merchant_name ~* '^WAL.*MART' THEN
        merchant_name := 'Walmart';
    -- Target variations
    ELSIF merchant_name ~* '^TARGET' THEN
        merchant_name := 'Target';
    -- Amazon variations
    ELSIF merchant_name ~* '^AMAZON' THEN
        merchant_name := 'Amazon';
    -- Starbucks variations
    ELSIF merchant_name ~* '^STARBUCKS' THEN
        merchant_name := 'Starbucks';
    -- McDonald's variations
    ELSIF merchant_name ~* '^MCD|MCDONALDS' THEN
        merchant_name := 'McDonald''s';
    -- Gas stations
    ELSIF merchant_name ~* '^SHELL' THEN
        merchant_name := 'Shell';
    ELSIF merchant_name ~* '^CHEVRON' THEN
        merchant_name := 'Chevron';
    ELSIF merchant_name ~* '^EXXON' THEN
        merchant_name := 'ExxonMobil';
    -- Grocery stores
    ELSIF merchant_name ~* '^SAFEWAY' THEN
        merchant_name := 'Safeway';
    ELSIF merchant_name ~* '^KROGER' THEN
        merchant_name := 'Kroger';
    END IF;

    -- Return null if the result is too short or generic
    IF LENGTH(merchant_name) < 2 OR merchant_name IN ('', 'N/A', 'UNKNOWN', 'MISC', 'OTHER') THEN
        RETURN NULL;
    END IF;

    RETURN merchant_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Populate Merchant Field for Existing Transactions
-- =====================================================
-- Update existing transactions with parsed merchant names

DO $$
DECLARE
    batch_size INTEGER := 1000;
    total_updated INTEGER := 0;
    batch_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting merchant field population...';

    LOOP
        -- Update transactions in batches
        UPDATE transactions
        SET merchant = extract_merchant_name(description)
        WHERE id IN (
            SELECT id
            FROM transactions
            WHERE merchant IS NULL
            LIMIT batch_size
        );

        GET DIAGNOSTICS batch_count = ROW_COUNT;
        total_updated := total_updated + batch_count;

        RAISE NOTICE 'Updated % transactions (total: %)', batch_count, total_updated;

        -- Exit when no more rows to update
        EXIT WHEN batch_count = 0;

        -- Small delay to avoid overwhelming the database
        PERFORM pg_sleep(0.1);
    END LOOP;

    RAISE NOTICE 'Merchant field population completed. Total transactions updated: %', total_updated;
END $$;

-- =====================================================
-- Verification Queries
-- =====================================================
-- Check the results of merchant parsing

-- Show merchant parsing results
SELECT
    'Merchant Parsing Results' as report_type,
    COUNT(*) as total_transactions,
    COUNT(merchant) as transactions_with_merchants,
    ROUND(COUNT(merchant) * 100.0 / COUNT(*), 2) as merchant_coverage_percent
FROM transactions;

-- Show top merchants by transaction count
SELECT
    'Top Merchants by Transaction Count' as report_type,
    merchant,
    COUNT(*) as transaction_count,
    SUM(ABS(amount)) as total_amount
FROM transactions
WHERE merchant IS NOT NULL
GROUP BY merchant
ORDER BY COUNT(*) DESC
LIMIT 20;

-- Show examples of parsed merchants
SELECT
    'Merchant Parsing Examples' as report_type,
    description,
    merchant,
    COUNT(*) as occurrences
FROM transactions
WHERE merchant IS NOT NULL
GROUP BY description, merchant
ORDER BY COUNT(*) DESC
LIMIT 10;

-- Show transactions that couldn't be parsed
SELECT
    'Unparsed Transactions Sample' as report_type,
    description,
    COUNT(*) as occurrences
FROM transactions
WHERE merchant IS NULL AND description IS NOT NULL
GROUP BY description
ORDER BY COUNT(*) DESC
LIMIT 10;

-- =====================================================
-- Update Financial Cube (Optional - for existing cube data)
-- =====================================================
-- Note: This is optional since the cube will be regenerated with merchant data
-- when the cube population process runs next

/*
-- Uncomment to update existing financial cube records
UPDATE financial_cube
SET merchant_name = (
    SELECT DISTINCT merchant
    FROM transactions t
    WHERE t.tenant_id = financial_cube.tenant_id
    AND t.account_id = financial_cube.account_id
    AND t.category_id = financial_cube.category_id
    AND DATE(t.date) >= financial_cube.period_start
    AND DATE(t.date) <= financial_cube.period_end
    AND t.type = financial_cube.transaction_type
    AND t.is_recurring = financial_cube.is_recurring
    AND t.merchant IS NOT NULL
    LIMIT 1
)
WHERE merchant_name IS NULL;
*/

-- =====================================================
-- Cleanup
-- =====================================================
-- Drop the temporary function (optional - keep if you want to reuse)
-- DROP FUNCTION IF EXISTS extract_merchant_name(TEXT);

-- =====================================================
-- Migration Complete
-- =====================================================
-- The migration is now complete. Key changes:
-- 1. Added 'merchant' field to transactions table
-- 2. Added 'merchant_name' field to financial_cube table
-- 3. Added performance indexes for merchant queries
-- 4. Parsed existing transaction descriptions to populate merchant field
-- 5. Provided verification queries to check results
--
-- Next steps:
-- 1. Update transaction creation logic to auto-populate merchant field
-- 2. Update financial cube population to include merchant aggregation
-- 3. Implement tooltip functionality in trends UI
-- 4. Test merchant parsing accuracy and adjust rules as needed

ANALYZE transactions;
ANALYZE financial_cube;

SELECT 'Migration completed successfully!' as status;
