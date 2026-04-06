This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | API **origin** only (no path). The client uses `<origin>/api/v1` for REST. If the value already ends with `/api/v1`, it is accepted as-is. |
| `NEXT_PUBLIC_DEV_STORE_ID` | Optional UUID for `/dashboard` when `GET /me/stores` is not implemented yet. |
| `NEXT_PUBLIC_RBAC_FALLBACK_ROLE` | Optional DX-only role when `GET /authz/me/permissions` returns 404/501. |

Admin UI (`/admin`) uses the same API base and `POST /auth/login` with a platform **admin** account.

**RBAC role assignments** (`/admin/rbac`): the frontend calls `GET/POST /admin/rbac/*` as documented in `docs/nest-admin-rbac-module.md`. Implement those routes in Nest (or proxy) so assign/revoke and pickers work. Optional `GET /admin/me` can return `isSuperAdmin` / `rbacAssignmentAllowed` to narrow access beyond `User.role === 'admin'`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3010](http://localhost:3010) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
