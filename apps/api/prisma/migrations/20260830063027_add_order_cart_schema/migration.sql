-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('DINE_IN', 'TAKE_OUT', 'DELIVERY');

-- CreateEnum
CREATE TYPE "OrderTimingType" AS ENUM ('IMMEDIATE', 'ADVANCE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MODIFICATION_REQUESTED', 'CANCELLED', 'COOKING', 'READY_FOR_PICKUP', 'READY_TO_SERVE', 'ASSIGNED_TO_RIDER', 'OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'GCASH_MANUAL', 'PAY_AT_COUNTER', 'PAY_AFTER_EATING');

-- CreateEnum
CREATE TYPE "PaymentState" AS ENUM ('UNPAID', 'PROOF_SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'REFUND_PENDING', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DeliveryFeeStatus" AS ENUM ('NOT_REQUIRED', 'PENDING_STAFF_REVIEW', 'PENDING_CUSTOMER_ACCEPTANCE', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "barangay" TEXT,
    "municipality" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT,
    "landmark" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "specialNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItemOption" (
    "id" TEXT NOT NULL,
    "cartItemId" TEXT NOT NULL,
    "menuOptionId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceDelta" DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "CartItemOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "addressId" TEXT,
    "serviceType" "ServiceType" NOT NULL,
    "timingType" "OrderTimingType" NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentState" "PaymentState" NOT NULL DEFAULT 'UNPAID',
    "deliveryFeeStatus" "DeliveryFeeStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "subtotalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "deliveryFeeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "additionalDeliveryFeeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "customerNotes" TEXT,
    "adminNotes" TEXT,
    "cancellationReason" TEXT,
    "preparationStartedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "specialNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemOption" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "menuOptionId" TEXT NOT NULL,
    "optionGroupName" TEXT NOT NULL,
    "optionName" TEXT NOT NULL,
    "priceDelta" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "OrderItemOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "changedById" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE INDEX "Address_isDefault_idx" ON "Address"("isDefault");

-- CreateIndex
CREATE INDEX "Cart_branchId_idx" ON "Cart"("branchId");

-- CreateIndex
CREATE INDEX "Cart_userId_idx" ON "Cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_branchId_userId_key" ON "Cart"("branchId", "userId");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateIndex
CREATE INDEX "CartItem_menuItemId_idx" ON "CartItem"("menuItemId");

-- CreateIndex
CREATE INDEX "CartItemOption_cartItemId_idx" ON "CartItemOption"("cartItemId");

-- CreateIndex
CREATE INDEX "CartItemOption_menuOptionId_idx" ON "CartItemOption"("menuOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItemOption_cartItemId_menuOptionId_key" ON "CartItemOption"("cartItemId", "menuOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_branchId_idx" ON "Order"("branchId");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_addressId_idx" ON "Order"("addressId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_paymentState_idx" ON "Order"("paymentState");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_scheduledFor_idx" ON "Order"("scheduledFor");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_menuItemId_idx" ON "OrderItem"("menuItemId");

-- CreateIndex
CREATE INDEX "OrderItemOption_orderItemId_idx" ON "OrderItemOption"("orderItemId");

-- CreateIndex
CREATE INDEX "OrderItemOption_menuOptionId_idx" ON "OrderItemOption"("menuOptionId");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_changedById_idx" ON "OrderStatusHistory"("changedById");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_toStatus_idx" ON "OrderStatusHistory"("toStatus");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_createdAt_idx" ON "OrderStatusHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItemOption" ADD CONSTRAINT "CartItemOption_cartItemId_fkey" FOREIGN KEY ("cartItemId") REFERENCES "CartItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItemOption" ADD CONSTRAINT "CartItemOption_menuOptionId_fkey" FOREIGN KEY ("menuOptionId") REFERENCES "MenuOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemOption" ADD CONSTRAINT "OrderItemOption_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemOption" ADD CONSTRAINT "OrderItemOption_menuOptionId_fkey" FOREIGN KEY ("menuOptionId") REFERENCES "MenuOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
