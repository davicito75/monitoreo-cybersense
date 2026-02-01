-- CreateTable
CREATE TABLE "NotificationConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnDown" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnUp" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnSlowResponse" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnSSLExpiry" BOOLEAN NOT NULL DEFAULT true,
    "sslExpiryDays" INTEGER NOT NULL DEFAULT 30,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "badgeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
