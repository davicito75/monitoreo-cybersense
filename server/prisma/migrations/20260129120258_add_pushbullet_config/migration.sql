-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NotificationConfig" (
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
    "pushbulletEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushbulletToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_NotificationConfig" ("badgeEnabled", "createdAt", "id", "notifyOnDown", "notifyOnSSLExpiry", "notifyOnSlowResponse", "notifyOnUp", "pushEnabled", "quietHoursEnabled", "quietHoursEnd", "quietHoursStart", "soundEnabled", "sslExpiryDays", "updatedAt") SELECT "badgeEnabled", "createdAt", "id", "notifyOnDown", "notifyOnSSLExpiry", "notifyOnSlowResponse", "notifyOnUp", "pushEnabled", "quietHoursEnabled", "quietHoursEnd", "quietHoursStart", "soundEnabled", "sslExpiryDays", "updatedAt" FROM "NotificationConfig";
DROP TABLE "NotificationConfig";
ALTER TABLE "new_NotificationConfig" RENAME TO "NotificationConfig";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
