import { z } from "zod";

export const RBAC_STORE_ROLE_SLUGS = ["store_owner", "store_manager", "staff", "moderator"] as const;
export const RBAC_GLOBAL_ROLE_SLUGS = ["super_admin"] as const;
export const RBAC_ALL_ASSIGNABLE_SLUGS = [...RBAC_GLOBAL_ROLE_SLUGS, ...RBAC_STORE_ROLE_SLUGS] as const;

export type RbacAssignableSlug = (typeof RBAC_ALL_ASSIGNABLE_SLUGS)[number];

export const assignRoleFormSchema = z
  .object({
    targetUserId: z.string().uuid("Select a valid user."),
    scope: z.enum(["global", "store"]),
    storeId: z.string().uuid().optional().nullable(),
    roleSlug: z.enum(
      [
        "super_admin",
        "store_owner",
        "store_manager",
        "staff",
        "moderator",
      ] as const,
      { message: "Choose a role." },
    ),
  })
  .superRefine((data, ctx) => {
    if (data.scope === "global") {
      if (data.roleSlug !== "super_admin") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Global scope is only for super_admin.",
          path: ["roleSlug"],
        });
      }
      if (data.storeId != null && data.storeId !== "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Global assignments must not include a store.",
          path: ["storeId"],
        });
      }
    } else {
      if (data.roleSlug === "super_admin") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "super_admin cannot be assigned in store scope.",
          path: ["roleSlug"],
        });
      }
      if (!data.storeId || !z.string().uuid().safeParse(data.storeId).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pick a store for store-scoped roles.",
          path: ["storeId"],
        });
      }
    }
  });

export type AssignRoleFormValues = z.infer<typeof assignRoleFormSchema>;

export function toAssignBody(values: AssignRoleFormValues): {
  targetUserId: string;
  storeId: string | null;
  roleSlug: string;
} {
  return {
    targetUserId: values.targetUserId,
    storeId: values.scope === "global" ? null : values.storeId ?? null,
    roleSlug: values.roleSlug,
  };
}
