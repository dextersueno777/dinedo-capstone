-- CreateTable
CREATE TABLE "CustomerStrike" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "issuedById" TEXT,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerStrike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerStrike_customerId_idx" ON "CustomerStrike"("customerId");

-- CreateIndex
CREATE INDEX "CustomerStrike_orderId_idx" ON "CustomerStrike"("orderId");

-- CreateIndex
CREATE INDEX "CustomerStrike_issuedById_idx" ON "CustomerStrike"("issuedById");

-- CreateIndex
CREATE INDEX "CustomerStrike_createdAt_idx" ON "CustomerStrike"("createdAt");

-- AddForeignKey
ALTER TABLE "CustomerStrike" ADD CONSTRAINT "CustomerStrike_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerStrike" ADD CONSTRAINT "CustomerStrike_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerStrike" ADD CONSTRAINT "CustomerStrike_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
