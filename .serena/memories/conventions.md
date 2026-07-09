# Conventions

- Bahasa user-facing/respons: Indonesia.
- DB table definitions use camelCase TypeScript properties mapped to snake_case SQL columns.
- Existing schema uses `createdAt` but most tables do not yet have `updatedAt`; follow local pattern unless deliberately improving a touched new table.
- API routes generally check `auth()` and `session.user.tenantId`, then filter DB queries by tenant.
- Legacy product dependencies are broad: orders, promos, consultation slots, dashboard, finance, Pakasir webhook. Do not remove `products` until all references migrate.