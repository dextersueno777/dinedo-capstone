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
