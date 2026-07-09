# Suggested Commands

- Use `rtk` prefix for shell commands in this workspace.
- Inspect git: `rtk git status --short --branch`.
- Lint: `rtk npm run lint`.
- Build/type check: `rtk npm run build`.
- Drizzle config: `drizzle.config.ts`; schema path `src/db/schema.ts`; migrations output `src/db/migrations`.
- Generate migration when DB schema changes: `rtk npx drizzle-kit generate` if dependency/network state allows.