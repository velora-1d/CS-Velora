# Task Completion

- For code changes, run at least `rtk npm run lint` when feasible.
- For schema/API changes, run `rtk npm run build` when feasible because it catches TypeScript and route signature errors.
- If Drizzle schema changes, generate/check migration output before declaring DB work complete.
- Report any command not run or blocked by sandbox/network/dependency issues.