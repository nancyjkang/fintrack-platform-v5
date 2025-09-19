-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "balance_date" TIMESTAMP(3) NOT NULL,
    "color" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "net_worth_category" TEXT NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" INTEGER NOT NULL,
    "category_id" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_balance_anchors" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" INTEGER NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "anchor_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_balance_anchors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spending_goals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal_type" TEXT NOT NULL,
    "target_amount" DECIMAL(12,2) NOT NULL,
    "timeframe" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "alert_warning_threshold" INTEGER NOT NULL DEFAULT 80,
    "alert_critical_threshold" INTEGER NOT NULL DEFAULT 90,
    "criteria_category_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "criteria_account_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "criteria_recurring" BOOLEAN,
    "criteria_transaction_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spending_goals_pkey" PRIMARY KEY ("id")
);

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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_user_id_tenant_id_key" ON "memberships"("user_id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_tenant_id_name_key" ON "accounts"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenant_id_name_type_key" ON "categories"("tenant_id", "name", "type");

-- CreateIndex
CREATE INDEX "financial_cube_tenant_id_category_id_period_start_idx" ON "financial_cube"("tenant_id", "category_id", "period_start");

-- CreateIndex
CREATE INDEX "financial_cube_tenant_id_account_id_period_start_idx" ON "financial_cube"("tenant_id", "account_id", "period_start");

-- CreateIndex
CREATE INDEX "financial_cube_tenant_id_transaction_type_period_start_idx" ON "financial_cube"("tenant_id", "transaction_type", "period_start");

-- CreateIndex
CREATE INDEX "financial_cube_tenant_id_is_recurring_period_start_idx" ON "financial_cube"("tenant_id", "is_recurring", "period_start");

-- CreateIndex
CREATE INDEX "financial_cube_updated_at_idx" ON "financial_cube"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "financial_cube_tenant_id_period_type_period_start_transacti_key" ON "financial_cube"("tenant_id", "period_type", "period_start", "transaction_type", "category_id", "account_id", "is_recurring");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_balance_anchors" ADD CONSTRAINT "account_balance_anchors_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_balance_anchors" ADD CONSTRAINT "account_balance_anchors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spending_goals" ADD CONSTRAINT "spending_goals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_cube" ADD CONSTRAINT "financial_cube_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_cube" ADD CONSTRAINT "financial_cube_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_cube" ADD CONSTRAINT "financial_cube_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

