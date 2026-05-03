import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /** When true, do not attach `x-store-id` (vendor-wide dashboard, etc.). */
    skipStoreContext?: boolean;
    /** When true, do not send `Authorization` (public endpoints while a token exists locally). */
    skipAuth?: boolean;
  }
}
