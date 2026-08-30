-- CreateEnum
CREATE TYPE "RiderAvailabilityStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFF_DUTY', 'DISABLED');

-- CreateEnum
CREATE TYPE "RiderShiftStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING_ASSIGNMENT', 'ASSIGNED', 'ACCEPTED', 'REJECTED_BY_RIDER', 'OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "DeliveryIssueStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProofOfDeliveryType" AS ENUM ('PHOTO', 'SIGNATURE', 'ADMIN_BYPASS');

-- CreateEnum
CREATE TYPE "CodRemittanceStatus" AS ENUM ('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "RiderProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "availabilityStatus" "RiderAvailabilityStatus" NOT NULL DEFAULT 'OFF_DUTY',
    "vehicleType" TEXT,
    "plateNumber" TEXT,
    "emergencyContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RiderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderShift" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "status" "RiderShiftStatus" NOT NULL DEFAULT 'OPEN',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "riderId" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING_ASSIGNMENT',
    "assignedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "outForDeliveryAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "issueSummary" TEXT,
    "navigationAddress" TEXT,
    "customerContactSnapshot" TEXT,
    "codAmountToCollect" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "deliveryFeeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryIssue" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "reportedById" TEXT,
    "status" "DeliveryIssueStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DeliveryIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofOfDelivery" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "capturedById" TEXT,
    "type" "ProofOfDeliveryType" NOT NULL,
    "imageUrl" TEXT,
    "signatureUrl" TEXT,
    "notes" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProofOfDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodRemittance" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "verifiedById" TEXT,
    "status" "CodRemittanceStatus" NOT NULL DEFAULT 'PENDING',
    "remittanceDate" TIMESTAMP(3) NOT NULL,
    "expectedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "submittedAmount" DECIMAL(10,2),
    "varianceAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "proofImageUrl" TEXT,
    "riderNotes" TEXT,
    "adminNotes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CodRemittance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodRemittanceDelivery" (
    "id" TEXT NOT NULL,
    "codRemittanceId" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodRemittanceDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiderProfile_userId_key" ON "RiderProfile"("userId");

-- CreateIndex
CREATE INDEX "RiderProfile_branchId_idx" ON "RiderProfile"("branchId");

-- CreateIndex
CREATE INDEX "RiderProfile_availabilityStatus_idx" ON "RiderProfile"("availabilityStatus");

-- CreateIndex
CREATE INDEX "RiderShift_branchId_idx" ON "RiderShift"("branchId");

-- CreateIndex
CREATE INDEX "RiderShift_riderId_idx" ON "RiderShift"("riderId");

-- CreateIndex
CREATE INDEX "RiderShift_status_idx" ON "RiderShift"("status");

-- CreateIndex
CREATE INDEX "RiderShift_startedAt_idx" ON "RiderShift"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_orderId_key" ON "Delivery"("orderId");

-- CreateIndex
CREATE INDEX "Delivery_branchId_idx" ON "Delivery"("branchId");

-- CreateIndex
CREATE INDEX "Delivery_orderId_idx" ON "Delivery"("orderId");

-- CreateIndex
CREATE INDEX "Delivery_riderId_idx" ON "Delivery"("riderId");

-- CreateIndex
CREATE INDEX "Delivery_status_idx" ON "Delivery"("status");

-- CreateIndex
CREATE INDEX "Delivery_assignedAt_idx" ON "Delivery"("assignedAt");

-- CreateIndex
CREATE INDEX "Delivery_deliveredAt_idx" ON "Delivery"("deliveredAt");

-- CreateIndex
CREATE INDEX "DeliveryIssue_deliveryId_idx" ON "DeliveryIssue"("deliveryId");

-- CreateIndex
CREATE INDEX "DeliveryIssue_reportedById_idx" ON "DeliveryIssue"("reportedById");

-- CreateIndex
CREATE INDEX "DeliveryIssue_status_idx" ON "DeliveryIssue"("status");

-- CreateIndex
CREATE INDEX "DeliveryIssue_createdAt_idx" ON "DeliveryIssue"("createdAt");

-- CreateIndex
CREATE INDEX "ProofOfDelivery_deliveryId_idx" ON "ProofOfDelivery"("deliveryId");

-- CreateIndex
CREATE INDEX "ProofOfDelivery_capturedById_idx" ON "ProofOfDelivery"("capturedById");

-- CreateIndex
CREATE INDEX "ProofOfDelivery_type_idx" ON "ProofOfDelivery"("type");

-- CreateIndex
CREATE INDEX "ProofOfDelivery_capturedAt_idx" ON "ProofOfDelivery"("capturedAt");

-- CreateIndex
CREATE INDEX "CodRemittance_branchId_idx" ON "CodRemittance"("branchId");

-- CreateIndex
CREATE INDEX "CodRemittance_riderId_idx" ON "CodRemittance"("riderId");

-- CreateIndex
CREATE INDEX "CodRemittance_verifiedById_idx" ON "CodRemittance"("verifiedById");

-- CreateIndex
CREATE INDEX "CodRemittance_status_idx" ON "CodRemittance"("status");

-- CreateIndex
CREATE INDEX "CodRemittance_remittanceDate_idx" ON "CodRemittance"("remittanceDate");

-- CreateIndex
CREATE INDEX "CodRemittanceDelivery_codRemittanceId_idx" ON "CodRemittanceDelivery"("codRemittanceId");

-- CreateIndex
CREATE INDEX "CodRemittanceDelivery_deliveryId_idx" ON "CodRemittanceDelivery"("deliveryId");

-- CreateIndex
CREATE UNIQUE INDEX "CodRemittanceDelivery_codRemittanceId_deliveryId_key" ON "CodRemittanceDelivery"("codRemittanceId", "deliveryId");

-- AddForeignKey
ALTER TABLE "RiderProfile" ADD CONSTRAINT "RiderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderProfile" ADD CONSTRAINT "RiderProfile_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderShift" ADD CONSTRAINT "RiderShift_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderShift" ADD CONSTRAINT "RiderShift_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryIssue" ADD CONSTRAINT "DeliveryIssue_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryIssue" ADD CONSTRAINT "DeliveryIssue_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofOfDelivery" ADD CONSTRAINT "ProofOfDelivery_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofOfDelivery" ADD CONSTRAINT "ProofOfDelivery_capturedById_fkey" FOREIGN KEY ("capturedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodRemittance" ADD CONSTRAINT "CodRemittance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodRemittance" ADD CONSTRAINT "CodRemittance_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodRemittance" ADD CONSTRAINT "CodRemittance_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodRemittanceDelivery" ADD CONSTRAINT "CodRemittanceDelivery_codRemittanceId_fkey" FOREIGN KEY ("codRemittanceId") REFERENCES "CodRemittance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodRemittanceDelivery" ADD CONSTRAINT "CodRemittanceDelivery_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
