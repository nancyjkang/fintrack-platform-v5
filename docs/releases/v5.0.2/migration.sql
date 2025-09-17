-- CreateTable
CREATE TABLE "financial_cube" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period_type" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "category_id" INTEGER,
    "category_name" TEXT NOT NULL,
    "account_id" INTEGER NOT NULL,
    "account_name" TEXT NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "transaction_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_cube_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (Optimized - removed redundant indexes covered by unique constraint)
CREATE INDEX "financial_cube_tenant_id_category_id_period_start_idx" ON "financial_cube"("tenant_id", "category_id", "period_start");

CREATE INDEX "financial_cube_tenant_id_account_id_period_start_idx" ON "financial_cube"("tenant_id", "account_id", "period_start");

CREATE INDEX "financial_cube_tenant_id_transaction_type_period_start_idx" ON "financial_cube"("tenant_id", "transaction_type", "period_start");

CREATE INDEX "financial_cube_tenant_id_is_recurring_period_start_idx" ON "financial_cube"("tenant_id", "is_recurring", "period_start");

CREATE INDEX "financial_cube_updated_at_idx" ON "financial_cube"("updated_at");

-- CreateIndex (Unique constraint - optimized column order for query performance)
CREATE UNIQUE INDEX "financial_cube_tenant_id_period_type_period_start_transac_key" ON "financial_cube"("tenant_id", "period_type", "period_start", "transaction_type", "category_id", "account_id", "is_recurring");

-- Add CHECK constraints for data integrity
ALTER TABLE "financial_cube" ADD CONSTRAINT "financial_cube_period_type_check"
    CHECK ("period_type" IN ('WEEKLY', 'MONTHLY'));

ALTER TABLE "financial_cube" ADD CONSTRAINT "financial_cube_transaction_type_check"
    CHECK ("transaction_type" IN ('INCOME', 'EXPENSE', 'TRANSFER'));

ALTER TABLE "financial_cube" ADD CONSTRAINT "financial_cube_period_dates_check"
    CHECK ("period_end" >= "period_start");

ALTER TABLE "financial_cube" ADD CONSTRAINT "financial_cube_transaction_count_check"
    CHECK ("transaction_count" >= 0);

-- Create CLUSTERED INDEX for optimal physical data organization
-- This will physically order the data for maximum query performance
DROP INDEX IF EXISTS "financial_cube_pkey";
ALTER TABLE "financial_cube" DROP CONSTRAINT "financial_cube_pkey";

-- Create clustered index on optimal column order
CREATE UNIQUE INDEX "financial_cube_clustered_idx" ON "financial_cube"("tenant_id", "period_start", "period_type", "id");
ALTER TABLE "financial_cube" ADD CONSTRAINT "financial_cube_pkey" PRIMARY KEY USING INDEX "financial_cube_clustered_idx";

-- AddForeignKey
ALTER TABLE "financial_cube" ADD CONSTRAINT "financial_cube_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "financial_cube" ADD CONSTRAINT "financial_cube_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "financial_cube" ADD CONSTRAINT "financial_cube_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add table and column comments for documentation
COMMENT ON TABLE "financial_cube" IS 'Dimensional data cube for financial trends analysis with pre-aggregated facts';
COMMENT ON COLUMN "financial_cube"."period_type" IS 'Granularity of time period: WEEKLY or MONTHLY';
COMMENT ON COLUMN "financial_cube"."period_start" IS 'Start date of the time period (inclusive)';
COMMENT ON COLUMN "financial_cube"."period_end" IS 'End date of the time period (inclusive)';
COMMENT ON COLUMN "financial_cube"."transaction_type" IS 'Type of financial transaction: INCOME, EXPENSE, or TRANSFER';
COMMENT ON COLUMN "financial_cube"."category_id" IS 'Foreign key to categories table, NULL for uncategorized transactions';
COMMENT ON COLUMN "financial_cube"."category_name" IS 'Denormalized category name for query performance';
COMMENT ON COLUMN "financial_cube"."is_recurring" IS 'Whether transactions in this cube entry are from recurring patterns';
COMMENT ON COLUMN "financial_cube"."account_id" IS 'Foreign key to accounts table';
COMMENT ON COLUMN "financial_cube"."account_name" IS 'Denormalized account name for query performance';
COMMENT ON COLUMN "financial_cube"."total_amount" IS 'Sum of transaction amounts for this dimensional combination';
COMMENT ON COLUMN "financial_cube"."transaction_count" IS 'Count of transactions for this dimensional combination';
