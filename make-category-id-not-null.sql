-- Make category_id NOT NULL after successful migration to default categories
-- This enforces the constraint that all transactions and cube records must have a category

-- Step 1: Final verification that no NULL categories remain
SELECT
  'Final check: NULL transactions' as check_name,
  COUNT(*) as count
FROM transactions
WHERE category_id IS NULL;

SELECT
  'Final check: NULL cube records' as check_name,
  COUNT(*) as count
FROM financial_cube
WHERE category_id IS NULL;

-- Step 2: Make category_id NOT NULL in both tables
-- This will fail if any NULL values still exist (which is what we want)

ALTER TABLE transactions ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE financial_cube ALTER COLUMN category_id SET NOT NULL;

-- Step 3: Verify the constraints are in place
SELECT
  'Verification: transactions.category_id constraint' as check_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name = 'category_id';

SELECT
  'Verification: financial_cube.category_id constraint' as check_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'financial_cube'
  AND column_name = 'category_id';

-- Step 4: Show that the unique constraint is working
SELECT
  'Verification: financial_cube unique constraint exists' as check_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'financial_cube'
  AND constraint_type = 'UNIQUE';

-- Success message
SELECT 'SUCCESS: category_id is now NOT NULL in both tables!' as result;
