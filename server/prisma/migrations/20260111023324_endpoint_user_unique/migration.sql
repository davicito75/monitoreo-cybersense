/*
  Warnings:

  - A unique constraint covering the columns `[endpoint,userId]` on the table `PushSubscription` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PushSubscription_endpoint_key";

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_userId_key" ON "PushSubscription"("endpoint", "userId");
