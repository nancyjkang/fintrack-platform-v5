-- Migration: Replace NULL categories with per-tenant "Uncategorized" default categories
-- This eliminates all NULL category handling complexity

-- Step 1: Create "Uncategorized" default categories for all existing tenants
-- One category per transaction type (INCOME, EXPENSE, TRANSFER) per tenant

INSERT INTO categories (tenant_id, name, type, color, created_at, updated_at)
SELECT DISTINCT
  t.tenant_id,
  CONCAT('Uncategorized ', INITCAP(LOWER(type_table.type))) as name,
  type_table.type,
  '#6B7280' as color,
  NOW() as created_at,
  NOW() as updated_at
FROM transactions t
CROSS JOIN (VALUES ('INCOME'), ('EXPENSE'), ('TRANSFER')) AS type_table(type)
WHERE t.category_id IS NULL
ON CONFLICT (tenant_id, name, type) DO NOTHING;

-- Step 2: Update NULL transactions to use the new default categories
UPDATE transactions
SET category_id = (
  SELECT c.id
  FROM categories c
  WHERE c.tenant_id = transactions.tenant_id
    AND c.name = CONCAT('Uncategorized ', INITCAP(LOWER(transactions.type)))
    AND c.type = transactions.type
  LIMIT 1
)
WHERE category_id IS NULL;

-- Step 3: Update NULL cube records to use the new default categories
UPDATE financial_cube
SET
  category_id = (
    SELECT c.id
    FROM categories c
    WHERE c.tenant_id = financial_cube.tenant_id
      AND c.name = CONCAT('Uncategorized ', INITCAP(LOWER(financial_cube.transaction_type)))
      AND c.type = financial_cube.transaction_type
    LIMIT 1
  ),
  category_name = CONCAT('Uncategorized ', INITCAP(LOWER(financial_cube.transaction_type)))
WHERE category_id IS NULL;

-- Step 4: Verification queries
SELECT
  'Verification: NULL transactions remaining' as check_name,
  COUNT(*) as count
FROM transactions
WHERE category_id IS NULL;

SELECT
  'Verification: NULL cube records remaining' as check_name,
  COUNT(*) as count
FROM financial_cube
WHERE category_id IS NULL;

SELECT
  'Verification: Default categories created' as check_name,
  tenant_id,
  type,
  COUNT(*) as category_count
FROM categories
WHERE name LIKE 'Uncategorized %'
GROUP BY tenant_id, type
ORDER BY tenant_id, type;

-- Step 5: Add the missing unique constraint (now that we have no NULLs)
ALTER TABLE financial_cube
ADD CONSTRAINT financial_cube_unique_constraint
UNIQUE (tenant_id, period_type, period_start, transaction_type, category_id, account_id, is_recurring);

-- Step 6: Make category_id NOT NULL (optional - can be done later)
-- ALTER TABLE transactions ALTER COLUMN category_id SET NOT NULL;
-- ALTER TABLE financial_cube ALTER COLUMN category_id SET NOT NULL;
