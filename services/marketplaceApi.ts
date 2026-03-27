import { api } from "@/services/api";
import { Order, Product, Vendor } from "@/types";

export const marketplaceApi = {
  getVendors: async () => {
    const { data } = await api.get<Vendor[]>("/vendors");
    return data;
  },
  getVendor: async (id: string) => {
    const { data } = await api.get<Vendor>(`/vendors/${id}`);
    return data;
  },
  getProducts: async (vendorId: string) => {
    const { data } = await api.get<Product[]>("/products", { params: { vendorId } });
    return data;
  },
  createOrder: async (order: Order) => {
    const { data } = await api.post<Order>("/orders", order);
    return data;
  },
  getOrder: async (id: string) => {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },
};
