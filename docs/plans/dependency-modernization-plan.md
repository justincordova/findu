# Dependency Modernization Plan

Source design: docs/designs/dependency-modernization.md

## Batch 1: Client — Expo SDK 55 + TS 6
- [ ] 1.1 Update Expo SDK to 55 (`npx expo install expo@latest`)
- [ ] 1.2 Run `npx expo install --fix` to align all expo-* packages
- [ ] 1.3 Update remaining client deps (axios, zustand, socket.io-client, lucide-react-native)
- [ ] 1.4 Install TypeScript 6 on client
- [ ] 1.5 Update client tsconfig.json (remove baseUrl, adjust paths, verify types)
- [ ] 1.6 Fix any lucide-react-native 1.x API changes
- [ ] 1.7 Verify client: `npm start` no warnings, `npm run lint` clean

## Batch 2: Server — ESM Migration
- [ ] 2.1 Install tsx, remove ts-node-dev and tsconfig-paths
- [ ] 2.2 Add `"type": "module"` to server package.json
- [ ] 2.3 Update all npm scripts to use tsx
- [ ] 2.4 Update server tsconfig.json for ESM (module, moduleResolution, remove baseUrl, update paths, target)
- [ ] 2.5 Verify server starts with `npm run dev`

## Batch 3: Server — Prisma 7 Migration
- [ ] 3.1 Install prisma@7, @prisma/client@7, @prisma/adapter-pg
- [ ] 3.2 Update schema.prisma (provider, datasource)
- [ ] 3.3 Create prisma.config.ts
- [ ] 3.4 Run npx prisma generate
- [ ] 3.5 Update prismaClient.ts with driver adapter
- [ ] 3.6 Verify DB connectivity with `npm run dev`

## Batch 4: Server — TS 6 + Remaining Deps
- [ ] 4.1 Install TypeScript 6 on server
- [ ] 4.2 Update remaining major deps (uuid, nodemailer, express-rate-limit, eslint, better-auth, etc.)
- [ ] 4.3 Update Jest config for ESM if needed
- [ ] 4.4 Verify: `npm run dev`, `npm test`, `npm run lint`

## Batch 5: Final Verification
- [ ] 5.1 Full lint on both client and server
- [ ] 5.2 Full test suite on server
- [ ] 5.3 Client starts without warnings
- [ ] 5.4 Update CLAUDE.md / SETUP.md if needed
