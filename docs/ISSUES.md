# Findu — Issues Found in Code Review

All references in this document are from commit `854259a` and later.
Each issue is independent and can be fixed in its own commit.

After each fix, verify with:

```bash
cd server && npm run build && npm run lint && npm test
cd client && npm run lint
```

## Execution Assignments

Each issue is labeled **SONNET**, **OPUS**, or **HUMAN**. Execute in
this order for the smallest risk:

| # | Issue | Assigned to | Why |
|---|---|---|---|
| 4 | Missing `handleValidationErrors` middleware | **SONNET** | Pure middleware insertion, 4 routes, no behavior logic |
| 5 | Matches validator field name mismatch | **SONNET** | Rename two fields; mechanical |
| 6 | Discover validator dead rule | **SONNET** | Remove unused validator rule; mechanical |
| 8 | `generateOTP` uses `Math.random()` | **SONNET** | Single-line swap to `crypto.randomInt` |
| 9 | Duplicate supabase client | **SONNET** | Delete one file, redirect one import |
| 1 | Storage upload authZ bypass | **OPUS** | Security-critical; needs API-contract decision on whether to reject `userId` in body or silently drop it; also check client usage |
| 2 | Likes authZ bypass | **OPUS** | Security-critical; touches validator + controller + client expectations |
| 3 | Profiles create authZ bypass | **OPUS** | Security-critical AND needs judgment on field validation gaps (interests/university_id/etc. unvalidated) |
| 7 | `createAccountWithPassword` not transactional | **OPUS** | Test assertions must be removed carefully; Sonnet has a known failure mode of weakening tests to make them pass |
| 10 | Dev security bypass in `app.ts` | **HUMAN** | Intent is ambiguous — may be deliberate for Expo LAN dev. Needs product context, not code reasoning |
| 11 | Chats storage blocking I/O and unsafe path | **OPUS** | Touches multer upload contract + content-type semantics; more surface area |
| 12 | `(req as any).user` repeated 25 times | **OPUS** | Cross-cutting refactor across 25+ files; declare augmentation once, verify nothing breaks globally |

**Rules when using SONNET:**

1. After Sonnet's fix, always review the *test diff*, not just the
   "tests pass" result. Sonnet's known failure mode is weakening
   assertions to make suites green.
2. Run `git diff` before commit and check no unrelated files were
   touched.
3. Verify the commit message matches the project's git conventions
   (lowercase, type(scope), no Claude attribution).

**Rules when using OPUS or HUMAN:**

1. Read the "Needs judgment" notes in each issue carefully.
2. Prefer splitting into separate commits when one issue touches
   multiple concerns (e.g. #3 has both authZ fix AND validator gaps).

**Safety note for any agent:** Items marked "Low risk" are mechanical;
items marked "Needs judgment" require deciding API contracts or touch
auth/test interactions and benefit from a stronger model or human
review. Never commit if `npm run build`, `npm test`, or `npm run lint`
fails.

---

## 1. [Critical] Storage upload authZ bypass

**File:** `server/src/modules/storage/controllers.ts:16`
**Route:** `POST /api/storage/url`
**Execute with:** **OPUS** (security-critical + API contract decision)
**Risk:** Low once the change is obvious. **Needs judgment** on whether the
client still sends `userId` (backward compat) or we reject requests that do.

### Problem

```ts
const { userId, filename, mode } = req.body;
```

`userId` comes straight from the request body. `mode === "setup"`
invokes `deleteAllUserFiles(userId)` which wipes every file under that
user's folder. Any authenticated user can delete another user's photos
by passing that user's id.

### Fix

Use the authenticated user's id. Do not read `userId` from the body.

```ts
// server/src/modules/storage/controllers.ts
export const generateUploadUrlController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;
    const { filename, mode } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!filename || !mode) {
      return res.status(400).json({ error: "Missing filename or mode" });
    }

    if (mode !== "setup" && mode !== "update") {
      return res
        .status(400)
        .json({ error: "Invalid mode. Must be 'setup' or 'update'." });
    }

    const result = await uploadsService.generateSignedUploadUrl(
      userId,
      filename,
      mode,
    );

    if ("error" in result) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ uploadUrl: result.uploadUrl, path: result.path });
  } catch (error) {
    logger.error("Error generating signed upload URL", {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: "Failed to generate upload URL" });
  }
};
```

### Client impact

Check `client/api/storage.ts` and `client/services/uploadService.ts` —
if they send `userId` in the body, drop it. Server will ignore it but
sending it is misleading.

### Tests

No existing storage service test covers the controller, only the
service. Consider adding one supertest-style test that hits the route
with a `userId` that does not match the auth session and asserts it
still uploads to the auth session user's folder.

---

## 2. [Critical] Likes authZ bypass

**File:** `server/src/modules/likes/controllers.ts:10-12`
**Route:** `POST /api/likes`
**Execute with:** **OPUS** (security-critical; touches validator + controller + client expectations)
**Risk:** Low. Mechanical change.

### Problem

```ts
const { from_user, to_user, is_superlike } = req.body;
const result = await LikesService.createLike(req.body);
```

`from_user` comes from the body. A malicious client can like anyone as
anyone, which also triggers matches with victims.

### Fix

Override `from_user` with the authenticated user id before passing to
the service. Drop `from_user` from the validator.

```ts
// server/src/modules/likes/controllers.ts
export const createLike = async (req: Request, res: Response) => {
  try {
    const authenticatedUserId = (req as any).user?.id;
    if (!authenticatedUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { to_user, is_superlike } = req.body;

    const result = await LikesService.createLike({
      from_user: authenticatedUserId,
      to_user,
      is_superlike,
    });

    logger.info("Like created successfully", {
      fromUser: authenticatedUserId,
      toUser: to_user,
      isSuperlike: is_superlike,
      matched: result.matched,
    });

    return res.status(201).json({
      like: result.like,
      matched: result.matched,
      matchId: result.matchId,
    });
  } catch (err: any) {
    // keep existing error classification
    ...
  }
};
```

```ts
// server/src/modules/likes/validators.ts
import { body } from "express-validator";

export const validateLike = [
  body("to_user").isUUID().withMessage("to_user must be a valid UUID"),
  body("is_superlike")
    .optional()
    .isBoolean()
    .withMessage("is_superlike must be boolean"),
];
```

### Tests

`server/src/tests/modules/likes.service.test.ts` tests the service, not
the controller, so it should keep passing unchanged.

---

## 3. [Critical] Profiles create authZ bypass

**File:** `server/src/modules/profiles/controllers.ts:8-19`
**Route:** `POST /api/profiles`
**Execute with:** **OPUS** (security-critical AND validator gaps to fill)
**Risk:** **Needs judgment**. The validator does not even require
`user_id`. The service blindly spreads `profileData` into
`prisma.profiles.create`. Need to decide: does the client send
`user_id` or is it derived server-side?

### Problem

```ts
const profileData = req.body;
const profile = await profileService.createProfile(profileData);
```

Anyone authenticated can create a profile for any user id, or overwrite
(via upsert-like flows) fields they should not control.

### Fix (recommended: derive user_id from session)

```ts
export const createProfileController = async (req: Request, res: Response) => {
  try {
    const authenticatedUserId = (req as any).user?.id;
    if (!authenticatedUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Force user_id to session user; ignore any client-supplied value
    const profileData = { ...req.body, user_id: authenticatedUserId };
    const profile = await profileService.createProfile(profileData);
    res.status(201).json(profile);
  } catch (error) {
    logger.error("Error creating profile", {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: "Failed to create profile" });
  }
};
```

### Also add to `validators.ts`

Require the required fields explicitly; currently many important
fields (interests, gender_preference, university_id, campus_id, min_age,
max_age, sexual_orientation) are not validated at all.

---

## 4. [Important] Missing `handleValidationErrors` middleware

**Files:**
- `server/src/modules/likes/routes.ts:12`
- `server/src/modules/storage/routes.ts:12`
- `server/src/modules/profiles/routes.ts:12,26,35`
- `server/src/modules/blocks/routes.ts:21,24` (no validators at all on unblock/get)

**Execute with:** **SONNET** (pure middleware insertion)
**Risk:** Low. Mechanical change.

### Problem

`validateLike`, `validateGenerateUploadUrl`, `validateCreateProfile`,
`validateUpdateProfile`, `validateDomainMap` run, but nothing reads
`validationResult(req)`. Invalid input silently passes to the
controller, which then accepts bad data or throws 500.

Compare to `chats/routes.ts` which correctly chains
`validator → handleValidationErrors → controller` as CLAUDE.md requires.

### Fix — each route

Add `handleValidationErrors` import and insert between validator and
controller, e.g.:

```ts
// server/src/modules/likes/routes.ts
import { handleValidationErrors } from "@/middleware/error/handleValidationErrors";
...
router.post("/", validateLike, handleValidationErrors, LikesController.createLike);
```

Do the same for `storage`, `profiles` (all three validated routes).

For `blocks`, either add validators + handler for `DELETE /:blockedId`
and `GET /` or accept that `:blockedId` is an opaque string (then at
least validate the UUID format).

---

## 5. [Important] Matches validator field name mismatch

**Files:**
- `server/src/modules/matches/validators.ts:3-6`
- `server/src/modules/matches/controllers.ts:52`

**Execute with:** **SONNET** (rename two fields)
**Risk:** Low. Mechanical.

### Problem

Validator checks `user1Id` and `user2Id`:
```ts
export const validateCreateMatch = [
  body("user1Id").isUUID()...,
  body("user2Id").isUUID()...,
];
```

But the controller reads:
```ts
const { user1, user2 } = req.body;
```

Since `user1Id`/`user2Id` are never present in the body, validation
passes trivially and the controller receives whatever `user1`/`user2`
the client sends — or `undefined`.

### Fix

Decide on one field naming convention and align both sides. Prefer
`user1` / `user2` to match the Prisma schema and existing code:

```ts
// server/src/modules/matches/validators.ts
export const validateCreateMatch = [
  body("user1").isUUID().withMessage("user1 must be a valid UUID"),
  body("user2").isUUID().withMessage("user2 must be a valid UUID"),
];
```

---

## 6. [Important] Discover validator dead rule

**File:** `server/src/modules/discover/validators.ts:6-21`
**Route:** `POST /api/discover/compatibility`
**Execute with:** **SONNET** (remove unused validator rule)
**Risk:** Low.

### Problem

```ts
export const validateCompatibilityRequest = [
  body("userId").isString().notEmpty()...,
  body("candidateId").isString().notEmpty()...,
  body("userId").custom((value, { req }) => {
    if (value === req.body.candidateId) {...}
    return true;
  }),
];
```

The controller (`discover/controllers.ts:83`) uses
`(req as any).user.id`, never `req.body.userId`. The validator forces
clients to pass their own id pointlessly, and the self-check is done
against an unused field.

### Fix

Remove `userId` validation; move the self-check to compare
`req.user.id` to `req.body.candidateId`.

```ts
export const validateCompatibilityRequest = [
  body("candidateId")
    .isString()
    .notEmpty()
    .withMessage("Candidate ID is required and must be a non-empty string"),
  body("candidateId").custom((value, { req }) => {
    if (value === (req as any).user?.id) {
      throw new Error("Cannot calculate compatibility with yourself");
    }
    return true;
  }),
];
```

Verify `client/api/discover.ts` does not rely on sending `userId`.

---

## 7. [Important] `createAccountWithPassword` not transactional

**File:** `server/src/modules/auth/services.ts:370-434`
**Execute with:** **OPUS** (test assertions must be removed carefully; Sonnet may weaken assertions to pass tests)
**Risk:** Low code change; medium test-update risk.

### Problem

`signUpAndVerify` (line 108) correctly wraps user + account creation
in `prisma.$transaction`. `createAccountWithPassword` is a near-duplicate
that does *not*, and instead uses a fragile manual cleanup:

```ts
// lines 424-428
const user = await prisma.user.findUnique({ where: { email } });
if (user) {
  await prisma.user.delete({ where: { id: user.id } });
}
```

If account.create fails after user.create, there are two separate
round trips that can themselves fail, leaving orphaned records.

### Fix

Mirror `signUpAndVerify`:

```ts
createAccountWithPassword: async (email, password): Promise<AuthResult> => {
  try {
    if (!/^[\w.+-]+@[\w-]+\.edu$/i.test(email)) {
      return { success: false, error: "Email must be a .edu address" };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "User already exists" };
    }

    const ctx = await auth.$context;
    const hashedPassword = await ctx.password.hash(password);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: email.split("@")[0] },
      });
      await tx.account.create({
        data: {
          userId: user.id,
          providerId: "credential",
          accountId: email,
          password: hashedPassword,
        },
      });
    });

    await redis.del(`otp:${email}`);
    logger.info("ACCOUNT_CREATED_SUCCESSFULLY", { email });

    return await AuthService.signIn(email, password);
  } catch (error: any) {
    const { message: errorMessage, name: errorName, stack: errorStack } = error || {};
    logger.error("CREATE_ACCOUNT_ERROR", {
      error: errorMessage || error,
      errorName,
      stack: errorStack,
      email,
    });
    return {
      success: false,
      error: errorMessage || "Failed to create account",
    };
  }
},
```

### Test impact — **Needs judgment**

`server/src/tests/modules/auth.service.test.ts` likely has tests that
assert `prisma.user.delete` was called on failure. Search for
"createAccountWithPassword" tests. Those assertions must be removed
because the transaction auto-rolls back (same pattern as the earlier
`signUpAndVerify` test update).

---

## 8. [Important] `generateOTP` uses `Math.random()`

**File:** `server/src/utils/auth.ts:16-18`
**Execute with:** **SONNET** (single-line swap to `crypto.randomInt`)
**Risk:** Low.

### Problem

```ts
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
```

`Math.random()` is not cryptographically secure. In a 6-digit space,
this matters: an attacker who sees one OTP (or times server
operations) can narrow the PRNG state.

### Fix

```ts
import { randomInt } from "node:crypto";

export const generateOTP = (): string => {
  // Uniform 6-digit value in [100000, 999999]
  return randomInt(100000, 1000000).toString();
};
```

### Tests

`server/src/tests/utils/auth.test.ts` only asserts
`result.toMatch(/^\d{6}$/)`, which still holds.

---

## 9. [Nit] Duplicate supabase client

**Files:**
- `server/src/lib/supabaseAdmin.ts`
- `server/src/lib/supabaseStorage.ts`

**Execute with:** **SONNET** (delete one file, redirect one import)
**Risk:** Low.

### Problem

Both create a supabase client with the same `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`. `supabaseAdmin.ts` throws if env is
missing; `supabaseStorage.ts` silently uses empty strings, producing a
broken client that fails only at first request.

Only `server/src/modules/chats/storage.ts` imports
`supabaseStorage`. Everything else uses `supabaseAdmin`.

### Fix

Delete `server/src/lib/supabaseStorage.ts`. In
`server/src/modules/chats/storage.ts`, change:

```ts
// from
import { supabase } from "@/lib/supabaseStorage";
// to
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
```

---

## 10. [Nit — Needs judgment] Dev security bypass in app.ts

**File:** `server/src/app.ts:36-52`
**Execute with:** **HUMAN** (ambiguous intent — may be deliberate for Expo LAN dev; needs product context, not code reasoning)
**Risk:** **Needs judgment** — the current behavior may be intentional
for Expo LAN testing.

### Problem

```ts
const isDev = process.env.NODE_ENV === "development";

if (!isDev) {
  app.use(cors); app.use(helmet); app.use(compression);
  app.use(morgan); app.use(limiter);
} else {
  // In dev, replace with no-op middleware to avoid hanging tests
  ...
}
```

`npm run dev` sets `NODE_ENV=development` (or leaves it unset).
That disables CORS, helmet, rate-limiter, etc. for local dev. This
is not obviously about tests — Jest already sets `NODE_ENV=test`
which takes the `if (!isDev)` branch.

If the goal is just to disable for Jest, gate on `"test"` instead:

```ts
const isTest = process.env.NODE_ENV === "test";
if (!isTest) {
  // apply real security middleware everywhere else
  ...
}
```

If the goal is "disable rate limiter for dev because it blocks hot
reloads" — then gate only the limiter, not helmet/cors/compression.
Confirm with product owner before changing.

---

## 11. [Nit] Chats storage blocking I/O and unsafe path

**File:** `server/src/modules/chats/storage.ts:47,51`
**Execute with:** **OPUS** (touches multer upload contract + content-type semantics; needs passing mimetype through the controller)
**Risk:** Low (for readFileSync swap); Medium for path sanitization
(changes storage layout).

### Problems

1. `fs.readFileSync(filePath)` (line 47) blocks the event loop on
   every chat media upload (up to 10MB).
2. `storagePath = \`match/${matchId}/${timestamp}-${fileName}\`` (line 51)
   concatenates `fileName` directly. If `fileName` contains `..` or
   `/`, path traversal is possible within the bucket.
3. `getMimeType(fileName)` (line 11) trusts the client-supplied
   filename extension to set `Content-Type` on the stored object.
   An attacker can upload any bytes under any content type.

### Fix

```ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
...
export async function uploadChatMedia(
  matchId: string,
  filePath: string,
  fileName: string,
): Promise<string> {
  // sanitize: strip directory components, keep basename only
  const safeName = path.basename(fileName);

  // validate
  const stat = await fs.stat(filePath);
  if (stat.size > MAX_FILE_SIZE) { ... }

  const fileBuffer = await fs.readFile(filePath);
  const storagePath = `match/${matchId}/${Date.now()}-${safeName}`;
  ...
}
```

For `contentType`, prefer the request's actual detected mime type
(multer provides `req.file.mimetype`); pass it through from the
controller to this helper rather than sniffing the extension.

---

## 12. [Nit] `(req as any).user` repeated 25 times

**Execute with:** **OPUS** (cross-cutting refactor across 25+ files; verify nothing breaks globally)
**Risk:** Low, quality only.

Declare a global Express Request augmentation once, e.g.
`server/src/types/express.d.ts`:

```ts
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string | null; role?: string };
    }
  }
}
export {};
```

Make sure `tsconfig.json` picks it up via `"include": ["src", "tests"]`
(already does). Then `const userId = req.user?.id;` works without
casts. Worth doing once across all controllers in a follow-up.

---

## Out of scope for this round

- CLAUDE.md says controllers must use `next(error)` for errors; several
  still send responses directly. Non-breaking, deferred.
- `client/utils/socketClient.ts` uses `console.log` instead of the
  project logger. Style only.
- Tests have `jest.restoreAllMocks()` + `jest.clearAllMocks()` combined
  (auth.service.test.ts:50-52) — redundant but harmless.
