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

export type UserSession = {
  id: string;
  name: string;
  email: string;
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
