/*
  Warnings:

  - You are about to alter the column `balance` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to alter the column `limit` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "balance" SET DEFAULT 0,
ALTER COLUMN "balance" SET DATA TYPE INTEGER,
ALTER COLUMN "limit" SET DEFAULT 0,
ALTER COLUMN "limit" SET DATA TYPE INTEGER;
