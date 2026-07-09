# Tech Stack

- TypeScript, Next.js 16 App Router, React 19.
- Auth: NextAuth v5 via `src/auth.ts` and API auth route.
- DB: PostgreSQL Neon using `@neondatabase/serverless`, Drizzle ORM, Drizzle Kit.
- Styling/UI: Tailwind CSS 4, Lucide React, Radix primitives/shadcn-style local components.
- Validation dependency available: Zod.
- Package scripts: `npm run dev`, `npm run build`, `npm run lint`.
- Project has both `package-lock.json` and `pnpm-lock.yaml`; existing scripts are npm-style.