import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /** When true, do not attach `x-store-id` (vendor-wide dashboard, etc.). */
    skipStoreContext?: boolean;
  }
}
