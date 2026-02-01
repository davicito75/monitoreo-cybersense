-- CreateTable
CREATE TABLE "MaintenanceWindow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MaintenanceMonitor" (
    "maintenanceId" INTEGER NOT NULL,
    "monitorId" INTEGER NOT NULL,

    PRIMARY KEY ("maintenanceId", "monitorId"),
    CONSTRAINT "MaintenanceMonitor_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "MaintenanceWindow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceMonitor_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
