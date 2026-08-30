-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "RestaurantTable" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'ACTIVE',
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RestaurantTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "reservationNumber" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "linkedOrderId" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "reservedFor" TIMESTAMP(3) NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "notes" TEXT,
    "downPaymentAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalEstimate" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "cancellationReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationTable" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationTable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RestaurantTable_branchId_idx" ON "RestaurantTable"("branchId");

-- CreateIndex
CREATE INDEX "RestaurantTable_status_idx" ON "RestaurantTable"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantTable_branchId_name_key" ON "RestaurantTable"("branchId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_reservationNumber_key" ON "Reservation"("reservationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_linkedOrderId_key" ON "Reservation"("linkedOrderId");

-- CreateIndex
CREATE INDEX "Reservation_branchId_idx" ON "Reservation"("branchId");

-- CreateIndex
CREATE INDEX "Reservation_customerId_idx" ON "Reservation"("customerId");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE INDEX "Reservation_reservedFor_idx" ON "Reservation"("reservedFor");

-- CreateIndex
CREATE INDEX "Reservation_createdAt_idx" ON "Reservation"("createdAt");

-- CreateIndex
CREATE INDEX "ReservationTable_reservationId_idx" ON "ReservationTable"("reservationId");

-- CreateIndex
CREATE INDEX "ReservationTable_tableId_idx" ON "ReservationTable"("tableId");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationTable_reservationId_tableId_key" ON "ReservationTable"("reservationId", "tableId");

-- AddForeignKey
ALTER TABLE "RestaurantTable" ADD CONSTRAINT "RestaurantTable_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_linkedOrderId_fkey" FOREIGN KEY ("linkedOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationTable" ADD CONSTRAINT "ReservationTable_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationTable" ADD CONSTRAINT "ReservationTable_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
