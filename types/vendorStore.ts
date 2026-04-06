/** Vendor-owned store entity — GET/POST/PATCH /stores */

export type VendorApiStoreStatus = "active" | "inactive" | "draft";

export type VendorStoreEntity = {
  id: string;
  vendorId: string;
  name: string;
  address: string;
  image: string | null;
  status: VendorApiStoreStatus;
  slug: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateStoreBody = {
  name: string;
  address: string;
  status?: VendorApiStoreStatus;
  image?: string;
  slug?: string;
};

export type PatchStoreBody = Partial<{
  name: string;
  address: string;
  status: VendorApiStoreStatus;
  image: string | null;
  slug: string | null;
}>;

export type DeleteStoreResponse = {
  message: string;
  id: string;
  softDeleted: boolean;
};
