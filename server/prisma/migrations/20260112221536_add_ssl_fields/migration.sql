-- AlterTable
ALTER TABLE "Monitor" ADD COLUMN "sslCertExpiry" DATETIME;
ALTER TABLE "Monitor" ADD COLUMN "sslDaysUntilExpiry" INTEGER;
ALTER TABLE "Monitor" ADD COLUMN "sslIssuer" TEXT;
ALTER TABLE "Monitor" ADD COLUMN "sslValid" BOOLEAN;
