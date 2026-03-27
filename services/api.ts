import axios from "axios";
import { createMockOrder, getMockOrder, products, vendors } from "@/services/mockData";
import { Order } from "@/types";

const wait = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = axios.create({
  baseURL: "https://api.urchenziconnect.local",
  adapter: async (config) => {
    await wait();

    const method = config.method?.toUpperCase();
    const url = config.url ?? "";
    const params = config.params ?? {};

    if (method === "GET" && url === "/vendors") {
      return {
        data: vendors,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    }

    if (method === "GET" && /^\/vendors\/[^/]+$/.test(url)) {
      const id = url.split("/").pop() ?? "";
      const vendor = vendors.find((item) => item.id === id);
      if (!vendor) throw new Error("Vendor not found");

      return {
        data: vendor,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    }

    if (method === "GET" && url === "/products") {
      const vendorId = params.vendorId as string | undefined;
      const filtered = vendorId
        ? products.filter((item) => item.vendorId === vendorId)
        : products;
      return {
        data: filtered,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    }

    if (method === "POST" && url === "/orders") {
      const order = (config.data ? JSON.parse(config.data as string) : {}) as Order;
      const created = createMockOrder(order);
      return {
        data: created,
        status: 201,
        statusText: "Created",
        headers: {},
        config,
      };
    }

    if (method === "GET" && /^\/orders\/[^/]+$/.test(url)) {
      const id = url.split("/").pop() ?? "";
      const order = getMockOrder(id);
      if (!order) throw new Error("Order not found");

      return {
        data: order,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    }

    throw new Error(`Unknown endpoint: ${method} ${url}`);
  },
});
