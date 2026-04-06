import { http } from "@/lib/api/client";
import type { UserRole } from "@/types";

/**
 * CreateCustomerProfileDto — POST /customers/onboard.
 * Persists firstName / lastName (varchar 100 each) with phone / address and current role.
 */
export type CreateCustomerProfileDto = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  role: UserRole;
};

export async function postCustomerOnboard(body: CreateCustomerProfileDto): Promise<void> {
  await http.post("/customers/onboard", {
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    phone: body.phone.trim(),
    address: body.address.trim(),
    role: body.role,
  });
}
