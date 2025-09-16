/*
  Warnings:

  - Added the required column `net_worth_category` to the `accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add column with default value first
ALTER TABLE "accounts" ADD COLUMN "net_worth_category" TEXT NOT NULL DEFAULT 'ASSET';

-- Update existing records based on account type
UPDATE "accounts" SET "net_worth_category" = 'LIABILITY' WHERE "type" IN ('CREDIT', 'CREDIT_CARD', 'LOAN');
UPDATE "accounts" SET "net_worth_category" = 'ASSET' WHERE "type" IN ('CHECKING', 'SAVINGS', 'INVESTMENT', 'CASH', 'TRADITIONAL_RETIREMENT', 'ROTH_RETIREMENT');
