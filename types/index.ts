export type VendorCategory = "food" | "groceries" | "pharmacy" | "shops" | "restaurants" | "supermarkets" | "flowers" | "alcohol" | "quick-commerce";

export type Vendor = {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  category: VendorCategory;
  deliveryFee: number;
  minOrder: number;
  freeDeliveryThreshold?: number;
  discount?: number;
  isOpen: boolean;
  description: string;
  estimatedDelivery?: string;
};

export type ProductCategory = "Popular" | "Meals" | "Drinks" | "Desserts";

export type Product = {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: ProductCategory;
};

export type CartItem = {
  id: string;
  productId: string;
  vendorId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export type OrderStatus =
  | "Pending"
  | "Accepted"
  | "Rider Assigned"
  | "On the way"
  | "Delivered";

export type Rider = {
  name: string;
  phone: string;
  vehicle: string;
};

export type Order = {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  address: string;
  paymentMethod: "Cash" | "Card";
  rider: Rider;
  createdAt: string;
};

/**
 * Backend user payload from /auth/* (public / toPublic). Identity is firstName + lastName only.
 */
export type ApiAuthUser = {
  id: string;
  userid: string;
  role: string;
  status?: string;
  /** When false, user must verify email (see POST /auth/resend-verification). */
  emailVerified?: boolean;
  email_verified?: boolean;
  isEmailVerified?: boolean;
  is_email_verified?: boolean;
  verified?: boolean;
  email: string;
  createdAt: string;
  /** Nullable — varchar 100; set via registration / OAuth / customer onboarding. */
  firstName: string | null;
  /** Nullable — varchar 100. */
  lastName: string | null;
  phone?: string | null;
  address?: string | null;
};

export type AuthLoginResponse = {
  message: string;
  access_token?: string;
  accessToken?: string;
  refreshToken?: string;
  status?: string;
  /** Backend currently returns this typo spelling on login/refresh. */
  isEmailVerifed?: boolean;
  /** Backward/forward compatible alias. */
  isEmailVerified?: boolean;
  user: ApiAuthUser;
};

export type UserRole = "customer" | "vendor" | "rider" | "admin";
export type UserStatus = "pending" | "active" | "suspended" | "unverified";

export type UserSession = {
  id: string;
  /** Display: trimmed `firstName` + `lastName`, or email local part when names missing. */
  name: string;
  /** From API — used with `lastName` for profile completeness (UsersService.isProfileComplete). */
  firstName?: string;
  lastName?: string;
  email: string;
  photoURL?: string;
  /** External auth id when using API backend */
  userid?: string;
  role?: UserRole;
  status?: UserStatus;
  /** Mirrors API; when false, show verify-email UI and resend. */
  emailVerified?: boolean;
  /** Delivery/contact — required for vendor/rider onboarding (ProfileCompleteGuard). */
  phone?: string;
  address?: string;
};

export type Address = {
  id: string;
  label: "Home" | "Work" | "Other";
  address: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
};

export type Promotion = {
  id: string;
  code: string;
  description: string;
  discount: number;
  discountType: "percentage" | "fixed";
  minOrder: number;
  expiresAt: string;
  maxUses: number;
  currentUses: number;
};

export type DeliveryTimeline = {
  status: OrderStatus;
  timestamp: string;
  description: string;
};
