"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { marketplaceApi } from "@/services/marketplaceApi";
import { Order } from "@/types";
import type { StorePageData } from "@/types/storePage";

export const useVendors = () =>
  useQuery({
    queryKey: ["vendors"],
    queryFn: marketplaceApi.getVendors,
  });

export const useVendor = (id: string) =>
  useQuery({
    queryKey: ["vendor", id],
    queryFn: () => marketplaceApi.getVendor(id),
    enabled: Boolean(id),
  });

export const useVendorProducts = (vendorId: string) =>
  useQuery({
    queryKey: ["products", vendorId],
    queryFn: () => marketplaceApi.getProducts(vendorId),
    enabled: Boolean(vendorId),
  });

export const useOrder = (id: string) =>
  useQuery({
    queryKey: ["order", id],
    queryFn: () => marketplaceApi.getOrder(id),
    enabled: Boolean(id),
  });

export const useCreateOrder = () =>
  useMutation({
    mutationFn: (order: Order) => marketplaceApi.createOrder(order),
  });

export const useStorePage = (slug: string) =>
  useQuery<StorePageData>({
    queryKey: ["store-page", slug],
    queryFn: () => marketplaceApi.getStorePageBySlug(slug),
    enabled: Boolean(slug),
  });
