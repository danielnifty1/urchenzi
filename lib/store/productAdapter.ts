import type { Product } from "@/types";
import type { StorePageProduct } from "@/types/storePage";

export function storeProductToCartProduct(
  p: StorePageProduct,
  vendorId: string,
): Product {
  return {
    id: p.id,
    vendorId,
    name: p.name,
    description: "",
    price: p.price,
    image: p.image,
    category: "Popular",
  };
}
