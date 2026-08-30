-- CreateEnum
CREATE TYPE "PaymentProofStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RefundMethod" AS ENUM ('GCASH_MANUAL', 'CASH_MANUAL');

-- CreateTable
CREATE TABLE "PaymentProof" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "status" "PaymentProofStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "amount" DECIMAL(10,2) NOT NULL,
    "proofImageUrl" TEXT NOT NULL,
    "gcashReferenceNumber" TEXT,
    "payerName" TEXT,
    "payerAccountLast4" TEXT,
    "rejectionReason" TEXT,
    "reviewNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "requestedById" TEXT,
    "processedById" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "method" "RefundMethod" NOT NULL DEFAULT 'GCASH_MANUAL',
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "adminNotes" TEXT,
    "gcashReferenceNumber" TEXT,
    "refundProofImageUrl" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentProof_orderId_idx" ON "PaymentProof"("orderId");

-- CreateIndex
CREATE INDEX "PaymentProof_uploadedById_idx" ON "PaymentProof"("uploadedById");

-- CreateIndex
CREATE INDEX "PaymentProof_reviewedById_idx" ON "PaymentProof"("reviewedById");

-- CreateIndex
CREATE INDEX "PaymentProof_status_idx" ON "PaymentProof"("status");

-- CreateIndex
CREATE INDEX "PaymentProof_submittedAt_idx" ON "PaymentProof"("submittedAt");

-- CreateIndex
CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");

-- CreateIndex
CREATE INDEX "Refund_customerId_idx" ON "Refund"("customerId");

-- CreateIndex
CREATE INDEX "Refund_requestedById_idx" ON "Refund"("requestedById");

-- CreateIndex
CREATE INDEX "Refund_processedById_idx" ON "Refund"("processedById");

-- CreateIndex
CREATE INDEX "Refund_status_idx" ON "Refund"("status");

-- CreateIndex
CREATE INDEX "Refund_requestedAt_idx" ON "Refund"("requestedAt");

-- AddForeignKey
ALTER TABLE "PaymentProof" ADD CONSTRAINT "PaymentProof_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentProof" ADD CONSTRAINT "PaymentProof_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentProof" ADD CONSTRAINT "PaymentProof_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
