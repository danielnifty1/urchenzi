/** Types for the Faji-style store detail page (mock / UI only). */

export type StoreCategoryNode = {
  id: string;
  label: string;
  children?: StoreCategoryNode[];
};

export type StorePageProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  categoryId: string;
  originalPrice?: number;
};

export type StorePageSection = {
  id: string;
  title: string;
  productIds: string[];
};

export type StorePageData = {
  slug: string;
  vendorId: string;
  name: string;
  city: string;
  breadcrumbCategory: string;
  bannerImage: string;
  ratingPercent: number;
  deliveryTime: string;
  deliveryFee: number;
  deliveryFeeFree?: boolean;
  isOpen: boolean;
  categories: StoreCategoryNode[];
  sections: StorePageSection[];
  products: Record<string, StorePageProduct>;
};
