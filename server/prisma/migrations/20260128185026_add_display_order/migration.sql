-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Monitor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "urlOrHost" TEXT NOT NULL,
    "port" INTEGER,
    "intervalSec" INTEGER NOT NULL DEFAULT 60,
    "retries" INTEGER NOT NULL DEFAULT 1,
    "timeoutMs" INTEGER NOT NULL DEFAULT 5000,
    "expectedStatus" INTEGER,
    "contentRegex" TEXT,
    "mssqlUsername" TEXT,
    "mssqlPassword" TEXT,
    "mssqlDatabase" TEXT,
    "mssqlQuery" TEXT,
    "notifyOnDown" BOOLEAN NOT NULL DEFAULT true,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "sslCertExpiry" DATETIME,
    "sslDaysUntilExpiry" INTEGER,
    "sslIssuer" TEXT,
    "sslValid" BOOLEAN,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Monitor" ("contentRegex", "createdAt", "expectedStatus", "id", "intervalSec", "isPaused", "mssqlDatabase", "mssqlPassword", "mssqlQuery", "mssqlUsername", "name", "notifyOnDown", "port", "retries", "sslCertExpiry", "sslDaysUntilExpiry", "sslIssuer", "sslValid", "timeoutMs", "type", "urlOrHost") SELECT "contentRegex", "createdAt", "expectedStatus", "id", "intervalSec", "isPaused", "mssqlDatabase", "mssqlPassword", "mssqlQuery", "mssqlUsername", "name", "notifyOnDown", "port", "retries", "sslCertExpiry", "sslDaysUntilExpiry", "sslIssuer", "sslValid", "timeoutMs", "type", "urlOrHost" FROM "Monitor";
DROP TABLE "Monitor";
ALTER TABLE "new_Monitor" RENAME TO "Monitor";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
