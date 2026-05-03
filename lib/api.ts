import type { AxiosRequestConfig } from "axios";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";
import { http } from "@/lib/api/client";

function unwrap<T>(data: unknown): T {
  if (data && typeof data === "object" && "data" in data && (data as { data?: unknown }).data !== undefined) {
    return (data as { data: T }).data;
  }
  return data as T;
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const { data } = await http.get<unknown>(url, config);
    return unwrap<T>(data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
