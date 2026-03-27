export type VendorCategory = "food" | "groceries" | "pharmacy" | "shops";

export type Vendor = {
  id: string;
  name: string;
  image: string;
  rating: number;
  deliveryTime: string;
  category: VendorCategory;
  deliveryFee: number;
  description: string;
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
