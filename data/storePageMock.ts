import type { StorePageData, StorePageProduct } from "@/types/storePage";

const products: Record<string, StorePageProduct> = {
  p1: {
    id: "p1",
    name: "Fresh Farm Eggs Large x6",
    price: 1850,
    originalPrice: 2100,
    image:
      "https://images.unsplash.com/photo-1582722870445-4476c7f55008?w=400&q=80",
    categoryId: "eggs",
  },
  p2: {
    id: "p2",
    name: "Organic Brown Eggs Medium x12",
    price: 3200,
    image:
      "https://images.unsplash.com/photo-1489726026293-d476cea365a4?w=400&q=80",
    categoryId: "eggs",
  },
  p3: {
    id: "p3",
    name: "Free Range Eggs x10",
    price: 2650,
    image:
      "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&q=80",
    categoryId: "eggs",
  },
  p4: {
    id: "p4",
    name: "Whole Milk 1L",
    price: 1200,
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80",
    categoryId: "milk",
  },
  p5: {
    id: "p5",
    name: "Semi-Skimmed Milk 2L",
    price: 2100,
    image:
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80",
    categoryId: "milk",
  },
  p6: {
    id: "p6",
    name: "Greek Yogurt Natural 500g",
    price: 1850,
    originalPrice: 2200,
    image:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80",
    categoryId: "dairy-other",
  },
  p7: {
    id: "p7",
    name: "Salted Butter 250g",
    price: 1450,
    image:
      "https://images.unsplash.com/photo-1589985270826-4b5641518377?w=400&q=80",
    categoryId: "butter",
  },
  p8: {
    id: "p8",
    name: "Whipping Cream 250ml",
    price: 1750,
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80",
    categoryId: "cream",
  },
};

const theMart: StorePageData = {
  slug: "the-mart",
  vendorId: "store-the-mart",
  name: "The Mart",
  city: "Lagos",
  breadcrumbCategory: "Groceries",
  bannerImage:
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80",
  ratingPercent: 84,
  deliveryTime: "50–60 min",
  deliveryFee: 890,
  deliveryFeeFree: false,
  isOpen: true,
  categories: [
    {
      id: "dairy",
      label: "Dairy, Milk & Eggs",
      children: [
        { id: "cream", label: "Cream" },
        {
          id: "eggs-butter",
          label: "Eggs & Butter",
          children: [
            { id: "eggs", label: "Eggs" },
            { id: "butter", label: "Butter" },
          ],
        },
        { id: "milk", label: "Milk" },
        { id: "dairy-other", label: "Yogurt & more" },
      ],
    },
  ],
  sections: [
    { id: "eggs", title: "Eggs", productIds: ["p1", "p2", "p3"] },
    { id: "milk", title: "Milk", productIds: ["p4", "p5"] },
    { id: "cream", title: "Cream", productIds: ["p8"] },
    { id: "butter", title: "Butter", productIds: ["p7"] },
    { id: "dairy-other", title: "Yogurt & more", productIds: ["p6"] },
  ],
  products,
};

const medplusStyle: StorePageData = {
  ...theMart,
  slug: "medplus-pharmacy-los",
  vendorId: "store-medplus",
  name: "Medplus Pharmacy",
  breadcrumbCategory: "Pharmacy & Beauty",
  isOpen: false,
  bannerImage:
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&q=80",
};

const STORES: Record<string, StorePageData> = {
  [theMart.slug]: theMart,
  [medplusStyle.slug]: medplusStyle,
};

/** Default open demo for the Faji-style `/store/[slug]` experience (mock data, cart works). */
export const DEMO_STORE_SLUG = theMart.slug;

/** Optional second mock: closed storefront (banner + “temporarily closed” state). */
export const DEMO_STORE_SLUG_CLOSED = medplusStyle.slug;

export function getStorePageData(slug: string): StorePageData | null {
  return STORES[slug] ?? theMart;
}
