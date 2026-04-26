# Dependency Modernization

## Context

FindU hasn't been updated in months. Both client and server have many outdated dependencies with known compatibility issues. The client is showing Expo SDK version mismatch warnings. The goal is to bring everything to latest stable versions in one pass, including major version bumps across Prisma 7, Expo SDK 55, TypeScript 6, and ESLint 10.

## Goals

- Upgrade client to Expo SDK 55 with all compatible packages
- Upgrade server to Prisma 7 with full ESM migration
- Upgrade TypeScript to 6.0 on both client and server
- Bump all other dependencies to latest majors where applicable
- Ensure the app builds, lints, and tests pass after migration

## Non-Goals

- Refactoring business logic or architecture
- Adding new features
- Changing database schema
- Updating deployment pipeline

## Design

### Phase 1: Client — Expo SDK 55 Upgrade

**Packages to update:**
- `expo` → 55.x (pins all expo-* packages to compatible versions)
- `react-native` → 0.83.x (SDK 55 target)
- `react`, `react-dom` → 19.2.x
- All `expo-*` packages to SDK 55 compatible versions via `npx expo install --fix`
- `eslint-config-expo` → 55.x
- `lucide-react-native` → 1.9.x (major rewrite, API changes possible)
- `socket.io-client` → latest 4.x
- `zustand` → 5.0.12
- `axios` → 1.15.x
- Other minor/patch bumps

**Key breaking change:** Expo SDK 54 was the last to support React Native's Old Architecture. SDK 55 requires the New Architecture. Run `npx expo install --fix` to align all versions.

**Steps:**
1. Update expo and react-native: `npx expo install expo@latest`
2. Run `npx expo install --fix` to align all expo-* packages
3. Update remaining non-expo packages
4. Fix any API changes from lucide-react-native 1.x
5. Update tsconfig.json for TS 6 compatibility
6. Test with `npm start`

### Phase 2: Client — TypeScript 6 Migration

**Changes to `client/tsconfig.json`:**
- Remove `baseUrl` (deprecated in TS 6)
- Update `paths` from `"@/*": ["./*"]` to `"@/*": ["./*"]` (paths now resolve relative to tsconfig location, not baseUrl)
- Add `"types"` if needed (TS 6 defaults to `[]`)
- Verify `expo/tsconfig.base` still provides correct defaults

**Steps:**
1. Install `typescript@6`
2. Update tsconfig.json — remove `baseUrl`, adjust `paths`
3. Run `npx tsc --noEmit` to check for errors
4. Fix any new strictness issues

### Phase 3: Server — ESM Migration

This is the prerequisite for Prisma 7. The server must switch from CommonJS to ESM.

**Changes to `server/package.json`:**
- Add `"type": "module"`
- Replace `ts-node-dev` with `tsx` in dev script
- Remove `tsconfig-paths/register` from all scripts
- Update script commands to use `tsx` instead of `ts-node-dev`

**Changes to `server/tsconfig.json`:**
- `"module": "commonjs"` → `"module": "ESNext"`
- Add `"moduleResolution": "bundler"`
- Remove `baseUrl`, update `paths` to `"@/*": ["./src/*"]`
- `"target": "es6"` → `"target": "es2025"`
- Keep `"strict": true`, `"esModuleInterop": true`
- Add `"ignoreDeprecations": "6.0"` if needed during migration

**Dev script change:**
```
Before: ts-node-dev --respawn --transpile-only --require tsconfig-paths/register --watch .env src/index.ts
After:  tsx watch src/index.ts
```

**Seed/debug script changes:**
```
Before: ts-node -r tsconfig-paths/register src/scripts/...
After:  tsx src/scripts/...
```

**Jest config changes:**
- Update `ts-jest` config for ESM (may need `--experimental-vm-modules`)
- Or use `tsx` as test runner via `jest --transform` config
- Verify test files still work with ESM imports

**Steps:**
1. Add `"type": "module"` to package.json
2. Install `tsx` as devDependency, remove `ts-node-dev` and `tsconfig-paths`
3. Update all npm scripts to use `tsx`
4. Update tsconfig.json for ESM
5. Run `npm run dev` and verify server starts
6. Fix any ESM-related issues
7. Update Jest config for ESM
8. Run `npm test` and verify

### Phase 4: Server — Prisma 7 Migration

**Packages:**
- `prisma` → 7.x
- `@prisma/client` → 7.x
- Add `@prisma/adapter-pg` (driver adapter for PostgreSQL)

**Schema changes (`schema.prisma`):**
- `provider = "prisma-client-js"` → `provider = "prisma-client"`
- Keep existing `output = "../src/generated/prisma"`
- Remove `url = env("DATABASE_URL")` from datasource (moved to config)

**New file `server/prisma.config.ts`:**
```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

**PrismaClient instantiation change (`src/lib/prismaClient.ts`):**
```ts
// Before
import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

// After
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter });
```

Note: The import path may need to be `@/generated/prisma` or `@/generated/prisma/client` depending on Prisma 7's output structure. Verify after `npx prisma generate`.

**Other Prisma 7 changes:**
- `prisma migrate dev` no longer auto-runs `prisma generate` — run it explicitly
- `prisma migrate dev` no longer auto-seeds — run `npx prisma db seed` explicitly
- Environment variables not loaded from `.env` by default — `dotenv` already used
- SSL cert validation may need `{ rejectUnauthorized: false }` for Supabase

**Steps:**
1. Install `@prisma/adapter-pg`, update `prisma` and `@prisma/client` to v7
2. Update `schema.prisma` generator
3. Create `prisma.config.ts`
4. Run `npx prisma generate`
5. Update `prismaClient.ts` with driver adapter
6. Run `npm run dev`, verify DB queries work
7. Run `npm test`, verify tests pass with mocked Prisma

### Phase 5: Server — TypeScript 6 + Remaining Dependencies

**TypeScript 6 changes:**
- Update `tsconfig.json` (already done in Phase 3 for ESM)
- Ensure `types: ["node", "jest"]` is set
- Remove any deprecated options

**Other major bumps:**
- `better-auth` → 1.6.x (check changelog for breaking changes)
- `uuid` → 14.x
- `nodemailer` → 8.x
- `express-rate-limit` → 8.x
- `eslint` → 10.x (already on flat config)
- `supertest` → 7.x (types moved)
- `@types/node` → 25.x
- All other minor/patch bumps

**Steps:**
1. Install TypeScript 6
2. Run `npx tsc --noEmit`, fix errors
3. Update remaining packages
4. Run lint, tests, dev server

### Phase 6: Verification

1. Server: `npm run dev` starts cleanly
2. Server: `npm test` passes
3. Server: `npm run lint` clean
4. Client: `npm start` launches without warnings
5. Client: `npm run lint` clean
6. End-to-end: Client connects to server, auth works

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Expo SDK version | 55 (latest) | Keeps project current, New Architecture required going forward |
| Prisma version | 7 (ESM-only) | User requested aggressive; server code already uses import/export |
| Server module system | ESM | Required by Prisma 7; future-proof |
| TypeScript version | 6.0 | User requested; transition release for TS 7 native port |
| Dev runner | tsx (replaces ts-node-dev) | ESM-compatible, faster, actively maintained |
| ESLint version | 10 | Already on flat config, smooth upgrade path |

## Rejected Alternatives

- **Stay on Prisma 6** — would avoid ESM migration but leaves a growing gap; Prisma 7 is the forward path
- **Use ts-node with ESM flags** — more complex config than tsx, slower
- **Skip Expo 55, just fix SDK 54 compat** — delays inevitable migration, SDK 54 is Old Architecture end-of-line

## Edge Cases & Constraints

- **Prisma 7 output path:** The generated client structure may differ from v6. Import paths in `prismaClient.ts` may need adjustment after `npx prisma generate`.
- **Jest + ESM:** Jest's ESM support still requires `--experimental-vm-modules` flag. May need to add `NODE_OPTIONS='--experimental-vm-modules'` to test script or switch to Vitest.
- **Lucide React Native 1.x:** Major API rewrite. Icon names or imports may have changed. Need to verify all used icons.
- **Socket.IO client:** Verify compatibility between client socket.io-client 4.8.x and server socket.io 4.8.x.
- **Better Auth 1.4 → 1.6:** Multiple minor versions. Check migration notes for breaking changes.
- **Prisma + Supabase SSL:** Supabase connections may need `ssl: { rejectUnauthorized: false }` in the adapter config.

## Open Questions

- None remaining — all decisions made during brainstorm.
