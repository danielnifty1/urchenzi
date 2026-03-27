import { Order, Product, Vendor } from "@/types";

export const vendors: Vendor[] = [
  {
    id: "v1",
    name: "Pizza Hub",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
    rating: 4.7,
    deliveryTime: "20-30 min",
    category: "food",
    deliveryFee: 1.5,
    description: "Fresh pizzas and oven-baked meals.",
  },
  {
    id: "v2",
    name: "Green Basket",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
    rating: 4.6,
    deliveryTime: "15-25 min",
    category: "groceries",
    deliveryFee: 1,
    description: "Daily groceries delivered in minutes.",
  },
  {
    id: "v3",
    name: "MediQuick",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
    rating: 4.8,
    deliveryTime: "25-35 min",
    category: "pharmacy",
    deliveryFee: 2,
    description: "Pharmacy essentials and wellness products.",
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

const orderStore = new Map<string, Order>();

export const createMockOrder = (order: Order) => {
  orderStore.set(order.id, order);
  return order;
};

export const getMockOrder = (id: string) => orderStore.get(id);
