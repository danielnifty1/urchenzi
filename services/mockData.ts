import { Order, Product, Vendor, Address, Promotion } from "@/types";

export const vendors: Vendor[] = [
  {
    id: "v1",
    name: "Pizza Hub",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
    rating: 4.7,
    reviewCount: 342,
    deliveryTime: "20-30 min",
    category: "food",
    deliveryFee: 1.5,
    minOrder: 12,
    freeDeliveryThreshold: 30,
    discount: 15,
    isOpen: true,
    description: "Fresh pizzas and oven-baked meals.",
    estimatedDelivery: "25 min",
  },
  {
    id: "v2",
    name: "Green Basket",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
    rating: 4.6,
    reviewCount: 256,
    deliveryTime: "15-25 min",
    category: "groceries",
    deliveryFee: 1,
    minOrder: 10,
    freeDeliveryThreshold: 25,
    discount: 10,
    isOpen: true,
    description: "Daily groceries delivered in minutes.",
    estimatedDelivery: "20 min",
  },
  {
    id: "v3",
    name: "MediQuick",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
    rating: 4.8,
    reviewCount: 189,
    deliveryTime: "25-35 min",
    category: "pharmacy",
    deliveryFee: 2,
    minOrder: 8,
    isOpen: true,
    description: "Pharmacy essentials and wellness products.",
    estimatedDelivery: "30 min",
  },
  {
    id: "v4",
    name: "Burger Station",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
    rating: 4.5,
    reviewCount: 412,
    deliveryTime: "18-28 min",
    category: "restaurants",
    deliveryFee: 1.2,
    minOrder: 15,
    freeDeliveryThreshold: 35,
    discount: 20,
    isOpen: true,
    description: "Premium burgers and fast food.",
    estimatedDelivery: "23 min",
  },
  {
    id: "v5",
    name: "Fresh Mart",
    image:
      "https://images.unsplash.com/photo-1488746890143-04541f90b2e8?w=800&q=80",
    rating: 4.7,
    reviewCount: 523,
    deliveryTime: "10-20 min",
    category: "supermarkets",
    deliveryFee: 0,
    minOrder: 5,
    freeDeliveryThreshold: 0,
    discount: 0,
    isOpen: true,
    description: "Quick commerce supermarket.",
    estimatedDelivery: "15 min",
  },
  {
    id: "v6",
    name: "Flower Paradise",
    image:
      "https://images.unsplash.com/photo-1519895917223-8c226c67d660?w=800&q=80",
    rating: 4.4,
    reviewCount: 145,
    deliveryTime: "30-40 min",
    category: "flowers",
    deliveryFee: 3,
    minOrder: 20,
    isOpen: true,
    description: "Fresh flowers for every occasion.",
    estimatedDelivery: "35 min",
  },
];

export const products: Product[] = [
  {
    id: "p1",
    vendorId: "v1",
    name: "Margherita Pizza",
    description: "Tomato sauce, mozzarella, fresh basil.",
    price: 9.5,
    image:
      "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&q=80",
    category: "Popular",
  },
  {
    id: "p2",
    vendorId: "v1",
    name: "Pepperoni Pizza",
    description: "Classic pepperoni and mozzarella.",
    price: 11,
    image:
      "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80",
    category: "Meals",
  },
  {
    id: "p3",
    vendorId: "v2",
    name: "Organic Bananas",
    description: "Fresh organic bananas (1kg).",
    price: 2.5,
    image:
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&q=80",
    category: "Popular",
  },
  {
    id: "p4",
    vendorId: "v2",
    name: "Whole Milk",
    description: "1L full cream milk.",
    price: 1.8,
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80",
    category: "Drinks",
  },
  {
    id: "p5",
    vendorId: "v3",
    name: "Vitamin C Tablets",
    description: "Supports immunity and daily wellness.",
    price: 6.2,
    image:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80",
    category: "Popular",
  },
  {
    id: "p6",
    vendorId: "v3",
    name: "Pain Relief Gel",
    description: "Fast action muscle and joint relief.",
    price: 4.9,
    image:
      "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800&q=80",
    category: "Meals",
  },
];

export const savedAddresses: Address[] = [
  {
    id: "a1",
    label: "Home",
    address: "123 Main Street, Apt 4B, New York, NY 10001",
    latitude: 40.7128,
    longitude: -74.006,
    isDefault: true,
  },
  {
    id: "a2",
    label: "Work",
    address: "456 Business Ave, Floor 12, New York, NY 10002",
    latitude: 40.715,
    longitude: -74.008,
    isDefault: false,
  },
];

export const promotions: Promotion[] = [
  {
    id: "promo1",
    code: "FIRST20",
    description: "20% off on your first order",
    discount: 20,
    discountType: "percentage",
    minOrder: 15,
    expiresAt: "2024-12-31",
    maxUses: 1000,
    currentUses: 342,
  },
  {
    id: "promo2",
    code: "SAVE5",
    description: "$5 off orders over $30",
    discount: 5,
    discountType: "fixed",
    minOrder: 30,
    expiresAt: "2024-12-25",
    maxUses: 5000,
    currentUses: 2100,
  },
  {
    id: "promo3",
    code: "DELIVERY50",
    description: "50% off delivery fee",
    discount: 50,
    discountType: "percentage",
    minOrder: 20,
    expiresAt: "2024-12-30",
    maxUses: 3000,
    currentUses: 1500,
  },
];

const orderStore = new Map<string, Order>();

export const createMockOrder = (order: Order) => {
  orderStore.set(order.id, order);
  return order;
};

export const getMockOrder = (id: string) => orderStore.get(id);
