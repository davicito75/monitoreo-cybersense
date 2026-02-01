-- CreateTable
CREATE TABLE "MonitorStats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "monitorId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "avgLatencyMs" INTEGER,
    "minLatencyMs" INTEGER,
    "maxLatencyMs" INTEGER,
    "upCount" INTEGER NOT NULL DEFAULT 0,
    "downCount" INTEGER NOT NULL DEFAULT 0,
    "totalChecks" INTEGER NOT NULL DEFAULT 0,
    "uptime" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonitorStats_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MonitorStats_monitorId_date_idx" ON "MonitorStats"("monitorId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MonitorStats_monitorId_date_key" ON "MonitorStats"("monitorId", "date");
