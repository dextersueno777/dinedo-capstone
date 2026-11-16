-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "depositDecisionAt" TIMESTAMP(3),
ADD COLUMN     "depositDecisionById" TEXT,
ADD COLUMN     "depositRequired" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ReservationDepositProof" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
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

    CONSTRAINT "ReservationDepositProof_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReservationDepositProof_reservationId_idx" ON "ReservationDepositProof"("reservationId");

-- CreateIndex
CREATE INDEX "ReservationDepositProof_uploadedById_idx" ON "ReservationDepositProof"("uploadedById");

-- CreateIndex
CREATE INDEX "ReservationDepositProof_reviewedById_idx" ON "ReservationDepositProof"("reviewedById");

-- CreateIndex
CREATE INDEX "ReservationDepositProof_status_idx" ON "ReservationDepositProof"("status");

-- CreateIndex
CREATE INDEX "ReservationDepositProof_submittedAt_idx" ON "ReservationDepositProof"("submittedAt");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_depositDecisionById_fkey" FOREIGN KEY ("depositDecisionById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationDepositProof" ADD CONSTRAINT "ReservationDepositProof_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationDepositProof" ADD CONSTRAINT "ReservationDepositProof_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationDepositProof" ADD CONSTRAINT "ReservationDepositProof_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
