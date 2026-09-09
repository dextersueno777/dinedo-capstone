export type UserRole = 'CUSTOMER' | 'ADMIN' | 'KITCHEN' | 'RIDER';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  branchId: string | null;
};

export type LoginResponse = {
  user: AuthUser;
  accessToken: string;
};

export type Branch = {
  id: string;
  code: string;
  name: string;
  address: string | null;
};

export type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};


export type MenuItemStatus = 'AVAILABLE' | 'SOLD_OUT' | 'HIDDEN';

export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type MenuItemImage = {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
};

export type MenuItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string | number;
  status: MenuItemStatus;
  isFeatured: boolean;
  sortOrder: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: MenuItemImage[];
};


export type CartItemOption = {
  id: string;
  quantity: number;
  priceDelta: string | number;
};

export type CartItem = {
  id: string;
  quantity: number;
  specialNotes: string | null;
  menuItem: {
    id: string;
    name: string;
    slug: string;
    price: string | number;
    status: MenuItemStatus;
  };
  options: CartItemOption[];
};

export type Cart = {
  id: string;
  branchId: string;
  userId: string;
  items: CartItem[];
};

export type AddCartItemPayload = {
  branchCode: string;
  menuItemId: string;
  quantity: number;
  specialNotes?: string;
  optionIds?: string[];
};

export type UpdateCartItemPayload = {
  quantity?: number;
  specialNotes?: string;
};


export type ServiceType = 'DINE_IN' | 'TAKE_OUT' | 'DELIVERY';

export type OrderTimingType = 'IMMEDIATE' | 'ADVANCE';

export type PaymentMethod =
  | 'COD'
  | 'GCASH_MANUAL'
  | 'PAY_AT_COUNTER'
  | 'PAY_AFTER_EATING';

export type OrderStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'MODIFICATION_REQUESTED'
  | 'CANCELLED'
  | 'COOKING'
  | 'READY_FOR_PICKUP'
  | 'READY_TO_SERVE'
  | 'ASSIGNED_TO_RIDER'
  | 'OUT_FOR_DELIVERY'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'COMPLETED';

export type PaymentState =
  | 'UNPAID'
  | 'PROOF_SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type DeliveryFeeStatus =
  | 'NOT_REQUIRED'
  | 'PENDING_STAFF_REVIEW'
  | 'PENDING_CUSTOMER_ACCEPTANCE'
  | 'ACCEPTED'
  | 'REJECTED';

export type CheckoutPayload = {
  branchCode: string;
  serviceType: ServiceType;
  timingType: OrderTimingType;
  scheduledFor?: string;
  addressId?: string;
  paymentMethod: PaymentMethod;
  deliveryDistanceKm?: number;
  customerNotes?: string;
};

export type OrderAddress = {
  id: string;
  label: string;
  recipient: string;
  phoneNumber: string;
  line1: string;
  barangay: string;
  municipality: string;
  province: string;
  landmark: string | null;
};

export type OrderItem = {
  id: string;
  itemName: string;
  unitPrice: string | number;
  quantity: number;
  lineTotal: string | number;
  specialNotes: string | null;
};

export type OrderStatusHistory = {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  reason: string | null;
  notes: string | null;
  createdAt: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  serviceType: ServiceType;
  timingType: OrderTimingType;
  scheduledFor: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentState: PaymentState;
  deliveryFeeStatus: DeliveryFeeStatus;
  subtotalAmount: string | number;
  deliveryFeeAmount: string | number;
  additionalDeliveryFeeAmount: string | number;
  totalAmount: string | number;
  customerNotes: string | null;
  createdAt: string;
  address: OrderAddress | null;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
};


export type CustomerAddress = {
  id: string;
  label: string;
  recipient: string;
  phoneNumber: string;
  line1: string;
  barangay: string | null;
  municipality: string;
  province: string;
  postalCode: string | null;
  landmark: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAddressPayload = {
  label: string;
  recipient: string;
  phoneNumber: string;
  line1: string;
  barangay?: string;
  municipality: string;
  province: string;
  postalCode?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
};

export type UpdateAddressPayload = Partial<CreateAddressPayload>;


export type PaymentProofStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type PaymentProof = {
  id: string;
  orderId: string;
  status: PaymentProofStatus;
  amount: string | number;
  proofImageUrl: string;
  gcashReferenceNumber: string | null;
  payerName: string | null;
  payerAccountLast4: string | null;
  rejectionReason: string | null;
  reviewNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  createdAt: string;
};

export type SubmitPaymentProofPayload = {
  amount: number;
  proofImageUrl: string;
  gcashReferenceNumber?: string;
  payerName?: string;
  payerAccountLast4?: string;
};


export type ReservationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export type ReservationBranch = {
  id: string;
  code: string;
  name: string;
};

export type ReservationTable = {
  table: {
    id: string;
    name: string;
    capacity: number;
    location: string | null;
  };
};

export type Reservation = {
  id: string;
  reservationNumber: string;
  status: ReservationStatus;
  reservedFor: string;
  guestCount: number;
  customerName: string;
  customerPhone: string;
  notes: string | null;
  downPaymentAmount: string | number;
  totalEstimate: string | number;
  adminNotes: string | null;
  rejectionReason: string | null;
  cancellationReason: string | null;
  approvedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  branch: ReservationBranch;
  tables: ReservationTable[];
};

export type CreateReservationPayload = {
  branchCode: string;
  reservedFor: string;
  guestCount: number;
  customerName: string;
  customerPhone: string;
  notes?: string;
  downPaymentAmount?: number;
  totalEstimate?: number;
};

export type CancelReservationPayload = {
  cancellationReason: string;
};


export type NotificationType =
  | 'ORDER_STATUS'
  | 'PAYMENT'
  | 'RESERVATION'
  | 'DELIVERY'
  | 'SYSTEM';

export type NotificationStatus =
  | 'UNREAD'
  | 'READ'
  | 'ARCHIVED';

export type NotificationBranch = {
  id: string;
  code: string;
  name: string;
} | null;

export type NotificationOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
} | null;

export type NotificationReservation = {
  id: string;
  reservationNumber: string;
  status: ReservationStatus;
  reservedFor: string;
} | null;

export type Notification = {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  data: unknown;
  readAt: string | null;
  createdAt: string;
  branch: NotificationBranch;
  order: NotificationOrder;
  reservation: NotificationReservation;
};

export type UnreadNotificationCount = {
  unreadCount: number;
};


export type AdminDashboardSummary = {
  branch: {
    id: string;
    code: string;
    name: string;
  } | null;
  period: {
    from: string | null;
    to: string | null;
  };
  orders: {
    total: number;
    pending: number;
    approved: number;
    cooking: number;
    delivered: number;
    completed: number;
    cancelled: number;
    grossSales: number;
    approvedPaymentsAmount: number;
  };
  reservations: {
    total: number;
    pending: number;
    approved: number;
    completed: number;
    cancelled: number;
    noShow: number;
    guestCountTotal: number;
  };
  deliveries: {
    total: number;
    pendingAssignment: number;
    assigned: number;
    outForDelivery: number;
    delivered: number;
    cancelled: number;
    failed: number;
    codAmountToCollect: number;
    deliveryFees: number;
  };
  payments: {
    proofsTotal: number;
    pendingReview: number;
    approved: number;
    rejected: number;
    submittedAmount: number;
  };
  inventory: {
    totalItems: number;
    activeItems: number;
    lowStockItems: number;
  };
};


export type AdminOrder = {
  id: string;
  orderNumber: string;
  serviceType: ServiceType;
  timingType: OrderTimingType;
  scheduledFor: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentState: PaymentState;
  deliveryFeeStatus: DeliveryFeeStatus;
  subtotalAmount: string | number;
  deliveryFeeAmount: string | number;
  additionalDeliveryFeeAmount: string | number;
  totalAmount: string | number;
  customerNotes: string | null;
  adminNotes: string | null;
  cancellationReason: string | null;
  preparationStartedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  customer: {
    id: string;
    email: string;
  };
  address: OrderAddress | null;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
};

export type UpdateAdminOrderStatusPayload = {
  status: OrderStatus;
  reason?: string;
  notes?: string;
};

export type SetAdminDeliveryFeePayload = {
  additionalDeliveryFeeAmount: number;
  adminNotes?: string;
};


export type KitchenOrder = {
  id: string;
  orderNumber: string;
  serviceType: ServiceType;
  timingType: OrderTimingType;
  scheduledFor: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentState: PaymentState;
  deliveryFeeStatus: DeliveryFeeStatus;
  subtotalAmount: string | number;
  totalAmount: string | number;
  customerNotes: string | null;
  preparationStartedAt: string | null;
  createdAt: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  customer: {
    id: string;
    email: string;
  };
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
};

export type UpdateKitchenOrderStatusPayload = {
  status: OrderStatus;
  notes?: string;
};


export type DeliveryStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'REJECTED_BY_RIDER'
  | 'OUT_FOR_DELIVERY'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED';

export type ProofOfDeliveryType =
  | 'PHOTO'
  | 'SIGNATURE';

export type RiderDelivery = {
  id: string;
  status: DeliveryStatus;
  assignedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  outForDeliveryAt: string | null;
  arrivedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  failedAt: string | null;
  issueSummary: string | null;
  navigationAddress: unknown;
  customerContactSnapshot: unknown;
  codAmountToCollect: string | number;
  deliveryFeeAmount: string | number;
  createdAt: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    serviceType: ServiceType;
    paymentMethod: PaymentMethod;
    paymentState: PaymentState;
    totalAmount: string | number;
  };
};

export type RejectRiderDeliveryPayload = {
  reason: string;
};

export type UpdateRiderDeliveryStatusPayload = {
  status: DeliveryStatus;
  notes?: string;
};

export type ReportDeliveryIssuePayload = {
  title: string;
  description: string;
};

export type CaptureProofOfDeliveryPayload = {
  type: ProofOfDeliveryType;
  imageUrl?: string;
  signatureUrl?: string;
  notes?: string;
};


export type AdminPaymentProof = {
  id: string;
  orderId: string;
  uploadedById: string;
  reviewedById: string | null;
  status: PaymentProofStatus;
  amount: string | number;
  proofImageUrl: string;
  gcashReferenceNumber: string;
  payerName: string;
  payerAccountLast4: string | null;
  rejectionReason: string | null;
  reviewNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    serviceType: ServiceType;
    paymentMethod: PaymentMethod;
    paymentState: PaymentState;
    totalAmount: string | number;
  };
  uploadedBy: {
    id: string;
    email: string;
    role: string;
  };
  reviewedBy: {
    id: string;
    email: string;
    role: string;
  } | null;
};

export type ReviewPaymentProofPayload = {
  status: PaymentProofStatus;
  reviewNotes?: string;
  rejectionReason?: string;
};


export type AdminReservation = {
  id: string;
  reservationNumber: string;
  status: ReservationStatus;
  reservedFor: string;
  guestCount: number;
  customerName: string;
  customerPhone: string;
  notes: string | null;
  downPaymentAmount: string | number;
  totalEstimate: string | number | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  cancellationReason: string | null;
  approvedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  branch: {
    id: string;
    code: string;
    name: string;
  };
  customer: {
    id: string;
    email: string;
    role: string;
  };
  tables: Array<{
    table: {
      id: string;
      name: string;
      capacity: number;
      location: string | null;
      status: string;
    };
  }>;
};

export type ReviewAdminReservationPayload = {
  status: ReservationStatus;
  tableIds?: string[];
  adminNotes?: string;
  rejectionReason?: string;
};

export type AssignAdminReservationTablesPayload = {
  tableIds: string[];
};

export type UpdateAdminReservationStatusPayload = {
  status: ReservationStatus;
  adminNotes?: string;
  cancellationReason?: string;
};

export type InventoryItemStatus = 'ACTIVE' | 'INACTIVE';

export type InventoryUnit =
  | 'PIECE'
  | 'SERVING'
  | 'GRAM'
  | 'KILOGRAM'
  | 'MILLILITER'
  | 'LITER'
  | 'PACK';

export type StockMovementType =
  | 'INITIAL_STOCK'
  | 'PURCHASE'
  | 'ORDER_USAGE'
  | 'WASTE'
  | 'ADJUSTMENT'
  | 'RETURNED';

export type AdminInventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  unit: InventoryUnit;
  status: InventoryItemStatus;
  currentQuantity: string;
  reorderLevel: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  branch: {
    id: string;
    code: string;
    name: string;
  };
};

export type AdminStockMovement = {
  id: string;
  type: StockMovementType;
  quantityChange: string;
  quantityAfter: string;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  inventoryItem: {
    id: string;
    name: string;
    sku: string | null;
    unit: InventoryUnit;
  };
  actor: {
    id: string;
    email: string;
    role: UserRole;
  } | null;
};

export type CreateAdminInventoryItemPayload = {
  branchCode: string;
  name: string;
  sku?: string;
  unit: InventoryUnit;
  currentQuantity?: number;
  reorderLevel?: number;
  notes?: string;
};

export type UpdateAdminInventoryItemPayload = {
  name?: string;
  sku?: string;
  unit?: InventoryUnit;
  status?: InventoryItemStatus;
  reorderLevel?: number;
  notes?: string;
};

export type CreateAdminStockMovementPayload = {
  type: StockMovementType;
  quantityChange: number;
  reason?: string;
  notes?: string;
};
