-- Final step: Make category_id NOT NULL after migration
-- Run this AFTER the main migration and application updates are deployed

-- Step 1: Verify no NULL categories remain
SELECT
  'Pre-check: NULL transactions' as check_name,
  COUNT(*) as count
FROM transactions
WHERE category_id IS NULL;

SELECT
  'Pre-check: NULL cube records' as check_name,
  COUNT(*) as count
FROM financial_cube
WHERE category_id IS NULL;

-- Step 2: Make category_id NOT NULL (only if above checks return 0)
-- ALTER TABLE transactions ALTER COLUMN category_id SET NOT NULL;
-- ALTER TABLE financial_cube ALTER COLUMN category_id SET NOT NULL;

-- Step 3: Update Prisma schema types (manual step)
-- In schema.prisma, change:
-- category_id  Int?     -> category_id  Int
--
-- Then run: npx prisma db push

-- Step 4: Final verification
SELECT
  'Final verification: Transaction constraints' as check_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name = 'category_id';

SELECT
  'Final verification: Cube constraints' as check_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'financial_cube'
  AND column_name = 'category_id';
