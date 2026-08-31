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
