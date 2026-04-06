# NestJS reference: admin RBAC assignment API

Implement alongside your existing `AuthzService`, JWT guard, and `User.role === 'admin'` (or `isSuperAdmin`) checks. All routes live under the global prefix `/api/v1`.

## Guards

- `JwtAuthGuard` + assert caller is platform super admin (`AuthzService.isSuperAdmin(userId)` **or** legacy `user.role === 'admin'` during migration).

## DTOs

```ts
// assign-revoke.dto.ts
export class AssignRbacDto {
  targetUserId!: string; // UUID
  storeId!: string | null; // null = global
  roleSlug!: 'super_admin' | 'store_owner' | 'store_manager' | 'staff' | 'moderator';
}
```

## Validation rules (server)

- `super_admin` **only** when `storeId === null`.
- Store roles **only** when `storeId` is a valid `stores.id` UUID.
- Reject privilege escalation (e.g. non–super-admin cannot assign `super_admin`).
- `POST assign`: if row exists → **409** with `{ statusCode: 409, code: 'ASSIGNMENT_EXISTS', message: '...' }`.
- `POST revoke`: delete by `(targetUserId, storeId, roleSlug)` or by `assignmentId` if you expose it.

## Controller sketch

```ts
@Controller('admin/rbac')
@UseGuards(JwtAuthGuard, AdminSuperGuard)
export class AdminRbacController {
  @Get('stores')
  listStores() { /* query stores + optional vendorId */ }

  @Get('users')
  searchUsers(@Query('q') q: string) { /* ILIKE email/name, limit 20 */ }

  @Get('users/:userId/roles')
  listRoles(@Param('userId') userId: string) { /* user_store_roles + global row */ }

  @Post('assign')
  assign(@Body() body: AssignRbacDto) { /* transactional insert */ }

  @Post('revoke')
  revoke(@Body() body: AssignRbacDto & { assignmentId?: string }) { /* delete */ }
}
```

## Optional

- `GET /admin/me` → `{ isSuperAdmin, rbacAssignmentAllowed?, role }` for the Next.js gate on `/admin/rbac`.
