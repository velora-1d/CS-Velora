# Core

- Next.js App Router monolith under `src/app`; API routes live in `src/app/api/**/route.ts`.
- DB schema is centralized in `src/db/schema.ts`; Drizzle migrations in `src/db/migrations`.
- Shared DB client: `src/lib/db.ts` exports `db` from Neon HTTP + Drizzle schema.
- Main tenant model: `tenants`; tenant-scoped operational tables use `tenantId`/`tenant_id`.
- Current product/catalog migration direction documented in `Brief/ROADMAP.md` and `Brief/docs/*`: dynamic catalog should be added alongside legacy `products` before dependency migration.
- Read `mem:tech_stack` for stack/package constraints, `mem:conventions` for code style, `mem:task_completion` for verification.