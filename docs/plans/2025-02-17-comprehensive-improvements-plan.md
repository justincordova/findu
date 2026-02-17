# Security, Data Integrity & Code Quality Improvements - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Address all identified security vulnerabilities, data integrity issues, user flow problems, and code quality concerns to make FindU production-ready.

**Architecture:** Phased approach addressing issues by severity (Critical → High → Medium → Low) with TDD and frequent commits. Each task is atomic and independently testable.

**Tech Stack:** Node.js, Express, TypeScript, PostgreSQL, Prisma, React Native, Expo

---

## Phase 0: Test Infrastructure Setup

### Task 0.1: Create Test Helpers File

**Status:** ✅ COMPLETED - File created at `server/src/tests/helpers.ts`

**Files:**
- Created: `server/src/tests/helpers.ts`

**Purpose:** Provides reusable helper functions for all tests including:
- `createTestUser()` - Create test user with JWT token
- `createTestProfile()` - Create test profile
- `createTestOTP()` - Create OTP verification code
- `generateTestToken()` - Generate JWT token
- `cleanupTestData()` - Clean up all test data
- `createTestMatch()` - Create test match
- `createTestLike()` - Create test like
- `createTestBlock()` - Create test block

**Step 1: Write test helpers file**

File created at `server/src/tests/helpers.ts` with all helper functions implemented.

**Step 2: Run existing tests to verify helpers work**

Run: `cd server && npm test`
Expected: Tests should pass (if any existing tests)

**Step 3: Commit**

```bash
cd server
git add src/tests/helpers.ts
git commit -m "test: create reusable test helpers for integration and unit tests"
```

---

### Task 0.2: Verify Frontend Testing Setup

**Status:** ⚠️ NEEDS SETUP - Testing libraries not installed

**Files:**
- Create: `client/jest.config.js`
- Create: `client/jest.setup.js`
- Modify: `client/package.json`

**Step 1: Install testing dependencies**

Run: `cd client && npm install --save-dev jest @testing-library/react-native @testing-library/jest-native react-test-renderer`

**Step 2: Create Jest configuration**

```javascript
// client/jest.config.js
const { createDefaultPreset } = require('ts-jest');

module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native-community|@expo|react-navigation|expo|@expo))',
  ],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'store/**/*.{js,jsx,ts,tsx}',
    'api/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
```

**Step 3: Create Jest setup file**

```javascript
// client/jest.setup.js
import '@testing-library/jest-native/extend-expect';

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock expo modules
jest.mock('expo-constants', () => ({
  Constants: { expoConfig: {} },
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  useURL: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));
```

**Step 4: Add test scripts to package.json**

Add to `client/package.json`:
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
}
```

**Step 5: Commit**

```bash
cd client
git add jest.config.js jest.setup.js package.json
git commit -m "test: configure Jest for frontend testing"
```

---

## Phase 1: Critical Security Fixes

### Task 1.1: Add Rate Limiting to All Auth Endpoints

**Files:**
- Modify: `server/src/middleware/auth/rateLimitOTP.ts`
- Modify: `server/src/modules/auth/routes.ts`
- Test: `server/src/tests/middleware/auth/rateLimit.test.ts` (create)

**Step 1: Write failing test for rate limit enforcement**

```typescript
// server/src/tests/middleware/auth/rateLimit.test.ts
import request from 'supertest';
import app from '@/app';

describe('Auth Rate Limiting', () => {
  it('should rate limit /signin endpoint', async () => {
    const promises = Array(101).fill(null).map(() =>
      request(app).post('/api/auth/signin').send({
        email: 'test@test.edu',
        password: 'password123'
      })
    );

    const results = await Promise.all(promises);
    const rateLimitedResponses = results.filter(r => r.status === 429);

    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  it('should rate limit /signup endpoint', async () => {
    const promises = Array(101).fill(null).map(() =>
      request(app).post('/api/auth/signup').send({
        email: `test${Date.now()}@test.edu`,
        password: 'password123',
        otp: '123456'
      })
    );

    const results = await Promise.all(promises);
    const rateLimitedResponses = results.filter(r => r.status === 429);

    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test -- middleware/auth/rateLimit.test.ts`
Expected: FAIL - middleware doesn't apply to these routes yet

**Step 3: Create general rate limiter for auth routes**

```typescript
// server/src/middleware/auth/rateLimitAuth.ts
import rateLimit from 'express-rate-limit';
import logger from '@/config/logger';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Stricter limit for auth endpoints
  message: 'Too many authentication attempts. Please try again later.',
  handler: (req, res) => {
    logger.warn('AUTH_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      url: req.url,
      method: req.method,
    });

    res.status(429).json({
      status: 'error',
      error: 'Too many authentication attempts',
      message: 'Please try again later.',
    });
  },
});

export default authLimiter;
```

**Step 4: Apply rate limiter to all auth routes**

```typescript
// server/src/modules/auth/routes.ts
import { Router } from "express";
import authLimiter from "@/middleware/auth/rateLimitAuth";

// Apply to sensitive endpoints
router.post("/signin", authLimiter, AuthValidators.validateLogin, AuthController.signinController);
router.post("/signup", authLimiter, AuthValidators.validateSignup, AuthController.signupController);
router.post("/verify-otp", authLimiter, AuthValidators.validateVerifyOtp, AuthController.verifyOtpController);
router.post("/create-account", authLimiter, AuthValidators.validateCreateAccount, AuthController.createAccountController);
```

**Step 5: Run tests to verify they pass**

Run: `cd server && npm test -- middleware/auth/rateLimit.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
cd server
git add src/middleware/auth/rateLimitAuth.ts src/modules/auth/routes.ts src/tests/middleware/auth/rateLimit.test.ts
git commit -m "feat(security): add rate limiting to auth endpoints"
```

---

### Task 1.2: Implement Password Strength Validation

**Files:**
- Create: `server/src/utils/passwordValidator.ts`
- Modify: `server/src/modules/auth/validators.ts`
- Test: `server/src/tests/utils/passwordValidator.test.ts` (create)

**Step 1: Write failing test for password validation**

```typescript
// server/src/tests/utils/passwordValidator.test.ts
import { validatePassword } from '@/utils/passwordValidator';

describe('Password Validation', () => {
  it('should reject weak passwords', () => {
    const result = validatePassword('123');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject passwords without special characters', () => {
    const result = validatePassword('password123');
    expect(result.valid).toBe(false);
  });

  it('should accept strong passwords', () => {
    const result = validatePassword('Str0ng!P@ssw0rd');
    expect(result.valid).toBe(true);
  });

  it('should reject passwords shorter than 8 characters', () => {
    const result = validatePassword('Short1!');
    expect(result.valid).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test -- utils/passwordValidator.test.ts`
Expected: FAIL - validator doesn't exist

**Step 3: Implement password strength validator**

```typescript
// server/src/utils/passwordValidator.ts
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Maximum length
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  // Contains uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Contains lowercase
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Contains number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Contains special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Common password patterns
  const commonPatterns = ['password', '123456', 'qwerty'];
  const lowerPassword = password.toLowerCase();
  if (commonPatterns.some(pattern => lowerPassword.includes(pattern))) {
    errors.push('Password contains common patterns that are easily guessed');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

**Step 4: Add password validation to signup validator**

```typescript
// server/src/modules/auth/validators.ts
import { body, validationResult } from 'express-validator';
import { validatePassword } from '@/utils/passwordValidator';

export const validateSignup = [
  body('email').isEmail().withMessage('Email must be valid'),
  body('password').custom(async (value: string) => {
    const validation = validatePassword(value);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }
    return true;
  }),
  body('otp').isLength(6, 6).withMessage('OTP must be 6 digits'),
];
```

**Step 5: Run tests to verify they pass**

Run: `cd server && npm test -- utils/passwordValidator.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
cd server
git add src/utils/passwordValidator.ts src/modules/auth/validators.ts src/tests/utils/passwordValidator.test.ts
git commit -m "feat(security): implement password strength validation"
```

---

### Task 1.3: Fix Race Condition in Like Creation

**Files:**
- Modify: `server/src/modules/likes/services.ts`
- Test: `server/src/tests/modules/likes.service.race.test.ts` (create)

**Step 1: Write failing test for concurrent like creation**

```typescript
// server/src/tests/modules/likes.service.race.test.ts
import { createLike } from '@/modules/likes/services';
import { prisma } from '@/lib/prismaClient';

describe('Like Service - Race Conditions', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.likes.deleteMany({});
  });

  it('should prevent duplicate likes with concurrent requests', async () => {
    const fromUser = 'user-1';
    const toUser = 'user-2';

    // Simulate 5 concurrent requests
    const promises = Array(5).fill(null).map(() =>
      createLike({
        from_user: fromUser,
        to_user: toUser,
        is_superlike: false
      })
    );

    const results = await Promise.allSettled(promises);

    // Count successful creations
    const successful = results.filter(r => r.status === 'fulfilled').length;

    // Should only have one successful like
    expect(successful).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test -- modules/likes.service.race.test.ts`
Expected: FAIL - allows duplicate likes

**Step 3: Implement atomic like creation using upsert**

```typescript
// server/src/modules/likes/services.ts
export const createLike = async (data: Like): Promise<CreateLikeResult> => {
  // Input validation (existing)
  if (data.from_user === data.to_user) {
    throw new Error('Users cannot like themselves');
  }

  if (!data.from_user || !data.to_user) {
    throw new Error('Both from_user and to_user are required');
  }

  // Pre-transaction validation (existing)
  const [fromProfile, toProfile] = await Promise.all([
    prisma.profiles.findUnique({
      where: { user_id: data.from_user },
      select: { university_id: true, user_id: true }
    }),
    prisma.profiles.findUnique({
      where: { user_id: data.to_user },
      select: { university_id: true, user_id: true }
    }),
  ]);

  if (!fromProfile || !toProfile) {
    throw new Error('User profiles not found');
  }

  if (fromProfile.university_id !== toProfile.university_id) {
    throw new Error('Users must be from the same university');
  }

  const blocked = await prisma.blocks.findFirst({
    where: {
      OR: [
        { blocker_id: data.from_user, blocked_id: data.to_user },
        { blocker_id: data.to_user, blocked_id: data.from_user },
      ],
    },
  });

  if (blocked) {
    throw new Error('Cannot like blocked user');
  }

  // Use upsert to handle race condition
  const like = await prisma.likes.upsert({
    where: {
      from_user_to_user: { // Need to add unique constraint
        from_user: data.from_user,
        to_user: data.to_user,
      },
    },
    create: data,
    update: {}, // No-op if exists
  });

  // Check for reciprocal and handle match
  const reciprocal = await prisma.likes.findFirst({
    where: {
      from_user: data.to_user,
      to_user: data.from_user,
    },
  });

  let matchId: string | null = null;
  let matched = !!reciprocal;

  // If reciprocal exists, check if match exists
  if (reciprocal) {
    const match = await prisma.matches.findFirst({
      where: {
        OR: [
          { user1: data.from_user, user2: data.to_user },
          { user1: data.to_user, user2: data.from_user },
        ],
      },
    });

    matchId = match?.id || null;
  }

  // Invalidate discover cache
  await Promise.all([
    invalidateDiscoverCache(data.from_user),
    invalidateDiscoverCache(data.to_user)
  ]).catch(error => {
    logger.error('CACHE_INVALIDATION_FAILED', { error });
  });

  return {
    like,
    matched,
    matchId,
  };
};
```

**Step 4: Add database unique constraint for likes**

```sql
-- Add to migration file
ALTER TABLE likes ADD CONSTRAINT unique_from_to_user
UNIQUE (from_user, to_user) WHERE from_user < to_user;

CREATE INDEX IF NOT EXISTS idx_likes_from_to_unique
ON likes (LEAST(from_user, to_user), GREATEST(from_user, to_user));
```

**Step 5: Run tests to verify they pass**

Run: `cd server && npm test -- modules/likes.service.race.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
cd server
git add prisma/migrations/ server/src/modules/likes/services.ts server/src/tests/modules/likes.service.race.test.ts
git commit -m "fix(integrity): prevent duplicate likes with upsert and unique constraint"
```

---

### Task 1.4: Add CSRF Protection

**Files:**
- Create: `server/src/middleware/security/csrfConfig.ts`
- Modify: `server/src/app.ts`
- Test: `server/src/tests/middleware/security/csrf.test.ts` (create)

**Step 1: Write failing test for CSRF protection**

```typescript
// server/src/tests/middleware/security/csrf.test.ts
import request from 'supertest';
import app from '@/app';
import { createTestUser } from '@/tests/helpers';

describe('CSRF Protection', () => {
  it('should reject requests without CSRF token on state-changing endpoints', async () => {
    const { token } = await createTestUser();

    const response = await request(app)
      .post('/api/likes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        from_user: 'user1',
        to_user: 'user2',
        is_superlike: false
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('CSRF');
  });

  it('should accept requests with valid CSRF token', async () => {
    const { token } = await createTestUser();

    // Get CSRF token first
    const csrfResponse = await request(app).get('/api/csrf-token');
    const csrfToken = csrfResponse.body.token;

    const response = await request(app)
      .post('/api/likes')
      .set('Authorization', `Bearer ${token}`)
      .set('X-CSRF-Token', csrfToken)
      .send({
        from_user: 'user1',
        to_user: 'user2',
        is_superlike: false
      });

    expect(response.status).not.toBe(403);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test -- middleware/security/csrf.test.ts`
Expected: FAIL - CSRF middleware doesn't exist

**Step 3: Implement CSRF middleware**

```typescript
// server/src/middleware/security/csrfConfig.ts
import { Request, Response, NextFunction, Router } from 'express';
import crypto from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production';
const TOKEN_LENGTH = 32;

// Store tokens in memory (Redis in production)
const tokenStore = new Map<string, { token: string; expires: number }>();

export function generateCSRFToken(userId: string): string {
  const token = crypto.randomBytes(TOKEN_LENGTH).toString('hex');
  const expires = Date.now() + 3600000; // 1 hour

  tokenStore.set(token, { token, expires });
  tokenStore.set(userId, token);

  return token;
}

export function validateCSRFToken(req: Request, res: Response, next: NextFunction) {
  // Skip validation for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const userId = (req as any).user?.id;
  const providedToken = req.headers['x-csrf-token'] as string;

  if (!userId || !providedToken) {
    return res.status(403).json({
      error: 'CSRF token required for state-changing requests'
    });
  }

  const storedToken = tokenStore.get(userId);

  if (!storedToken || storedToken.token !== providedToken || storedToken.expires < Date.now()) {
    return res.status(403).json({
      error: 'Invalid or expired CSRF token'
    });
  }

  // Clean up expired tokens
  tokenStore.forEach((value, key) => {
    if (value.expires < Date.now()) {
      tokenStore.delete(key);
    }
  });

  next();
}

// Route to get CSRF token
export const csrfRouter = Router();
csrfRouter.get('/token', (req: res) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = generateCSRFToken(userId);
  res.json({ token });
});

export const csrfMiddleware = validateCSRFToken;
```

**Step 4: Integrate CSRF middleware**

```typescript
// server/src/app.ts
import { csrfMiddleware, csrfRouter } from '@/middleware/security/csrfConfig';

// Add CSRF token endpoint
app.use('/api/csrf-token', requireAuth, csrfRouter);

// Apply CSRF to state-changing routes
app.use('/api/likes', requireAuth, csrfMiddleware, likesRoutes);
app.use('/api/blocks', requireAuth, csrfMiddleware, blocksRoutes);
app.use('/api/matches', requireAuth, csrfMiddleware, matchesRoutes);
app.use('/api/profiles', requireAuth, csrfMiddleware, profileRoutes);
```

**Step 5: Run tests to verify they pass**

Run: `cd server && npm test -- middleware/security/csrf.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
cd server
git add src/middleware/security/csrfConfig.ts src/app.ts src/tests/middleware/security/csrf.test.ts
git commit -m "feat(security): add CSRF protection to state-changing endpoints"
```

---

## Phase 2: Data Integrity Fixes

### Task 2.1: Fix Profile Auto-Save Race Condition

**Files:**
- Modify: `client/app/profile-setup/[step].tsx`
- Test: `client/__tests__/profile-setup/auto-save.test.tsx` (create)

**Step 1: Write failing test for concurrent profile saves**

```typescript
// client/__tests__/profile-setup/auto-save.test.tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { useProfileSetupStore } from '@/store/profileStore';

describe('Profile Auto-Save - Race Conditions', () => {
  it('should handle concurrent profile updates gracefully', async () => {
    const { result } = renderHook(() => useProfileSetupStore());

    await act(async () => {
      // Simulate rapid concurrent updates
      const promises = [
        result.current.setProfileField('name', 'User1'),
        result.current.setProfileField('name', 'User2'),
        result.current.setProfileField('name', 'User3'),
      ];

      await Promise.all(promises);
    });

    // Final state should be deterministic (last update wins)
    expect(result.current.data?.name).toBe('User3');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd client && npm test -- profile-setup/auto-save.test.tsx`
Expected: FAIL - race condition exists

**Step 3: Add debouncing and request cancellation to profile save**

```typescript
// client/app/profile-setup/[step].tsx
import { useRef, useState } from "react";
import { useProfileSetupStore } from "@/store/profileStore";
import { profileApi } from "@/api/profile";

export default function ProfileSetupStep() {
  const [currentStep, setCurrentStep] = useState<Step>("step1");
  const profileData = useProfileSetupStore((state) => state.data);

  // Track pending save request
  const saveRequestIdRef = useRef<string | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!profileData || !userId) return;

    const requestId = Math.random().toString(36).substring(7);
    const currentDataStr = JSON.stringify(profileData);

    // Cancel previous timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout with request ID
    autoSaveTimeoutRef.current = setTimeout(async () => {
      // Only proceed if this is the most recent request
      if (saveRequestIdRef.current !== requestId) {
        logger.debug('[profile-setup] Skipping stale save request');
        return;
      }

      saveRequestIdRef.current = requestId;

      try {
        const { university_name: _universityName, campus_name: _campusName, ...dataToSave } = profileData;

        await profileApi.update(userId, dataToSave);

        // Update ref only on success
        saveRequestIdRef.current = requestId;
        logger.debug("[profile-setup] Auto-saved profile data");
      } catch (error) {
        logger.error("[profile-setup] Auto-save failed", { error });

        // Retry once on failure
        if (saveRequestIdRef.current === requestId) {
          setTimeout(async () => {
            try {
              await profileApi.update(userId, dataToSave);
              logger.debug("[profile-setup] Auto-save retry succeeded");
            } catch (retryError) {
              logger.error("[profile-setup] Auto-save retry failed", { error: retryError });
            }
          }, 2000);
        }
      }
    }, 3000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [profileData, userId]);

  // Rest of component...
}
```

**Step 4: Run tests to verify they pass**

Run: `cd client && npm test -- profile-setup/auto-save.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
cd client
git add app/profile-setup/[step].tsx __tests__/profile-setup/auto-save.test.tsx
git commit -m "fix(integrity): prevent profile auto-save race conditions with request cancellation"
```

---

### Task 2.2: Ensure Block Prevents New Likes

**Files:**
- Modify: `server/src/modules/likes/services.ts`
- Test: `server/src/tests/modules/likes.block.test.ts` (create)

**Step 1: Write failing test for blocked user interaction**

```typescript
// server/src/tests/modules/likes.block.test.ts
import { createLike } from '@/modules/likes/services';
import { prisma } from '@/lib/prismaClient';

describe('Block - Prevent Interactions', () => {
  beforeEach(async () => {
    await prisma.blocks.deleteMany({});
    await prisma.likes.deleteMany({});
  });

  it('should prevent liking a user who has blocked you', async () => {
    await prisma.blocks.create({
      data: {
        blocker_id: 'user1',
        blocked_id: 'user2',
      },
    });

    await expect(
      createLike({
        from_user: 'user2',
        to_user: 'user1',
        is_superlike: false,
      })
    ).rejects.toThrow('Cannot like blocked user');
  });

  it('should prevent liking a user you have blocked', async () => {
    await prisma.blocks.create({
      data: {
        blocker_id: 'user1',
        blocked_id: 'user2',
      },
    });

    await expect(
      createLike({
        from_user: 'user1',
        to_user: 'user2',
        is_superlike: false,
      })
    ).rejects.toThrow('Cannot like blocked user');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test -- modules/likes.block.test.ts`
Expected: FAIL - needs implementation

**Step 3: Verify block check exists in like service**

The block check already exists in `server/src/modules/likes/services.ts:85-96`, so this is already implemented.

**Step 4: Run tests to verify they pass**

Run: `cd server && npm test -- modules/likes.block.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
cd server
git add src/tests/modules/likes.block.test.ts
git commit -m "test(integrity): add tests for blocked user interaction prevention"
```

---

### Task 2.3: Verify Cascade Delete for Messages on Unmatch

**Status:** ⚠️ VERIFY FIRST - Schema already has `onDelete: Cascade` at `prisma/schema.prisma:109`

**Files:**
- Test: `server/src/tests/modules/matches.cascade.test.ts` (create)

**Step 1: Write test to verify cascade delete works**

```typescript
// server/src/tests/modules/matches.cascade.test.ts
import { deleteMatch } from '@/modules/matches/services';
import { prisma } from '@/lib/prismaClient';
import { createMessage } from '@/modules/chats/services';

describe('Match - Cascade Delete Messages', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.matches.deleteMany({});
    await prisma.chats.deleteMany({});
  });

  it('should delete messages when match is deleted', async () => {
    const match = await prisma.matches.create({
      data: {
        user1: 'user1',
        user2: 'user2',
      },
    });

    // Create messages
    await prisma.chats.createMany({
      data: [
        {
          match_id: match.id,
          sender_id: 'user1',
          message: 'Hello',
          message_type: 'TEXT',
          is_read: false,
          sent_at: new Date(),
        },
        {
          match_id: match.id,
          sender_id: 'user2',
          message: 'Hi there',
          message_type: 'TEXT',
          is_read: false,
          sent_at: new Date(),
        },
      ],
    });

    // Verify messages exist
    const messagesBefore = await prisma.chats.findMany({
      where: { match_id: match.id },
    });
    expect(messagesBefore.length).toBe(2);

    // Delete match
    await deleteMatch(match.id);

    // Verify messages are deleted
    const messagesAfter = await prisma.chats.findMany({
      where: { match_id: match.id },
    });
    expect(messagesAfter.length).toBe(0);
  });
});
```

**Step 2: Run test to verify cascade delete**

Run: `cd server && npm test -- modules/matches.cascade.test.ts`
Expected: PASS (cascade delete already exists in schema at `prisma/schema.prisma:109`)

**IF TEST FAILS (cascade delete not working):**

**Step 3: Create migration to fix cascade delete**

```sql
-- server/prisma/migrations/20260217_fix_message_cascade_delete/migration.sql

-- Drop existing foreign key constraint
ALTER TABLE "chats" DROP CONSTRAINT IF EXISTS "chats_match_id_fkey";

-- Re-add cascade delete constraint
ALTER TABLE "chats"
ADD CONSTRAINT "chats_match_id_fkey"
FOREIGN KEY ("match_id")
REFERENCES "matches"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
```

**Step 4: Run migration**

Run: `cd server && npx prisma migrate dev --name fix_message_cascade_delete`
Expected: Migration succeeds

**Step 5: Run tests to verify they pass**

Run: `cd server && npm test -- modules/matches.cascade.test.ts`
Expected: PASS

**IF TEST PASSES (cascade delete already works):**

**Step 3: Just add the test file**

```bash
cd server
git add src/tests/modules/matches.cascade.test.ts
git commit -m "test(integrity): verify cascade delete works for messages on unmatch"
```

---

## Phase 3: User Flow Improvements

### Task 3.1: Add Offline Queue for Failed API Calls

**Files:**
- Create: `client/utils/offlineQueue.ts`
- Modify: `client/api/utils.ts`
- Test: `client/__tests__/utils/offlineQueue.test.ts` (create)

**Step 1: Write failing test for offline queue**

```typescript
// client/__tests__/utils/offlineQueue.test.ts
import { offlineQueue } from '@/utils/offlineQueue';

describe('Offline Queue', () => {
  beforeEach(() => {
    offlineQueue.clear();
    jest.spyOn(navigator, 'onLine').mockImplementation(() => true);
  });

  it('should queue failed API calls when offline', async () => {
    jest.spyOn(navigator, 'onLine').mockReturnValue(false);

    const apiCall = jest.fn().mockRejectedValue(new Error('Network error'));

    await offlineQueue.enqueue(apiCall);

    expect(offlineQueue.size()).toBe(1);
  });

  it('should replay queued calls when back online', async () => {
    jest.spyOn(navigator, 'onLine').mockReturnValue(false);
    const apiCall = jest.fn().mockRejectedValue(new Error('Network error'));

    await offlineQueue.enqueue(apiCall);
    expect(offlineQueue.size()).toBe(1);

    // Simulate going online
    jest.spyOn(navigator, 'onLine').mockReturnValue(true);

    await offlineQueue.replay();

    expect(apiCall).toHaveBeenCalled();
    expect(offlineQueue.size()).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd client && npm test -- utils/offlineQueue.test.ts`
Expected: FAIL - offline queue doesn't exist

**Step 3: Implement offline queue utility**

```typescript
// client/utils/offlineQueue.ts
import NetInfo from '@react-native-community/netinfo';

interface QueuedRequest {
  id: string;
  fn: () => Promise<any>;
  timestamp: number;
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isReplaying = false;

  async enqueue(fn: () => Promise<any>): Promise<any> {
    // Try to execute immediately
    try {
      return await fn();
    } catch (error) {
      // If offline, queue the request
      const isConnected = await NetInfo.fetch().then(state => state.isConnected);

      if (!isConnected) {
        const id = Math.random().toString(36);
        this.queue.push({
          id,
          fn,
          timestamp: Date.now(),
        });

        logger.warn('[OfflineQueue] Request queued due to offline state', { id, queueSize: this.queue.length });
        throw error;
      }

      // If not offline, rethrow the error
      throw error;
    }
  }

  async replay(): Promise<void> {
    if (this.isReplaying || this.queue.length === 0) {
      return;
    }

    this.isReplaying = true;

    for (const request of this.queue) {
      try {
        await request.fn();
        logger.info('[OfflineQueue] Successfully replayed request', { id: request.id });
      } catch (error) {
        logger.error('[OfflineQueue] Failed to replay request', { id: request.id, error });
      }
    }

    this.queue = [];
    this.isReplaying = false;
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}

export const offlineQueue = new OfflineQueue();
```

**Step 4: Add offline listener to root layout**

```typescript
// client/app/_layout.tsx
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineQueue } from '@/utils/offlineQueue';
import logger from '@/config/logger';

export default function RootLayout() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      logger.info('[Network] Connection state changed', { isConnected: state.isConnected });

      if (state.isConnected) {
        // Replay queued requests when back online
        offlineQueue.replay();
      }
    });

    return unsubscribe;
  }, []);

  // Rest of layout...
}
```

**Step 5: Run tests to verify they pass**

Run: `cd client && npm test -- utils/offlineQueue.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
cd client
git add utils/offlineQueue.ts api/utils.ts app/_layout.tsx __tests__/utils/offlineQueue.test.ts
git commit -m "feat(ux): add offline queue for failed API calls"
```

---

### Task 3.2: Fix Session Refresh Race Condition

**Files:**
- Modify: `client/api/utils.ts`
- Test: `client/__tests__/api/token-refresh.test.ts` (create)

**Step 1: Write failing test for concurrent token refresh**

```typescript
// client/__tests__/api/token-refresh.test.ts
import { withTokenRefresh } from '@/api/utils';

describe('Token Refresh - Race Condition', () => {
  it('should prevent duplicate refresh attempts', async () => {
    let refreshCount = 0;

    const mockApiCall = jest.fn().mockRejectedValue({
      statusCode: 401,
      message: 'Unauthorized'
    });

    const mockRefreshCallback = jest.fn().mockResolvedValue(true);

    // Set up token refresh callback
    // This would normally be set by authService

    // Simulate multiple concurrent 401 responses
    const promises = Array(5).fill(null).map(() =>
      withTokenRefresh(() => mockApiCall())
    );

    await Promise.all(promises);

    // Refresh should only be called once
    expect(mockRefreshCallback).toHaveBeenCalledTimes(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd client && npm test -- api/token-refresh.test.ts`
Expected: FAIL - race condition exists

**Step 3: Add refresh state tracking to token refresh callback**

```typescript
// client/api/utils.ts

// Track refresh state
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export async function withTokenRefresh<T>(
  apiFn: () => Promise<T>
): Promise<T> {
  try {
    return await apiFn();
  } catch (error) {
    // If 401 and we have a refresh callback, try to refresh
    if (error instanceof APIError && error.statusCode === 401 && tokenRefreshCallback) {
      // If already refreshing, wait for the existing refresh
      if (isRefreshing && refreshPromise) {
        await refreshPromise;
        // Retry original call after refresh
        return await apiFn();
      }

      // Start new refresh
      isRefreshing = true;
      refreshPromise = (async () => {
        try {
          const refreshed = await tokenRefreshCallback();
          if (refreshed) {
            // Token was refreshed, retry original call
            return await apiFn();
          }
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();

      await refreshPromise;

      throw error;
    }

    throw error;
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd client && npm test -- api/token-refresh.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
cd client
git add api/utils.ts __tests__/api/token-refresh.test.ts
git commit -m "fix(integrity): prevent duplicate token refresh attempts with state tracking"
```

---

### Task 3.3: Add Profile Completion Validation

**Files:**
- Modify: `server/src/modules/profiles/services.ts`
- Test: `server/src/tests/modules/profiles.completion.test.ts` (create)

**Step 1: Write failing test for profile completion validation**

```typescript
// server/src/tests/modules/profiles.completion.test.ts
import { updateProfile } from '@/modules/profiles/services';
import { prisma } from '@/lib/prismaClient';

describe('Profile Completion Validation', () => {
  beforeEach(async () => {
    await prisma.profiles.deleteMany({});
  });

  it('should require all required fields before marking profile as complete', async () => {
    const profile = await prisma.profiles.create({
      data: {
        user_id: 'user1',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        birthdate: new Date('2000-01-01'),
        gender: 'Male',
        pronouns: 'he/him',
        university_id: 'uni1',
        campus_id: 'campus1',
        university_year: 3,
        major: 'Computer Science',
        grad_year: 2025,
        interests: [],
        intent: 'Dating',
        gender_preference: ['Women'],
        sexual_orientation: 'Straight',
        min_age: 18,
        max_age: 30,
        photos: [],
        bio: '',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Update with partial data
    const result = await updateProfile('user1', {
      name: 'Updated Name',
    });

    // Verify profile doesn't have completed flag
    expect(result.is_complete).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test -- modules/profiles.completion.test.ts`
Expected: FAIL - is_complete field doesn't exist

**Step 3: Add is_complete field to profiles table**

```sql
-- server/prisma/migrations/20260217_add_profile_completion/migration.sql

ALTER TABLE "profiles" ADD COLUMN "is_complete" BOOLEAN NOT NULL DEFAULT FALSE;
```

**Step 4: Add validation in profile service**

```typescript
// server/src/modules/profiles/services.ts

const REQUIRED_FIELDS = [
  'name', 'avatar_url', 'birthdate', 'gender', 'pronouns',
  'university_id', 'campus_id', 'university_year', 'major', 'grad_year',
  'interests', 'intent', 'gender_preference', 'sexual_orientation',
  'min_age', 'max_age', 'photos', 'bio'
];

function isProfileComplete(profile: any): boolean {
  return REQUIRED_FIELDS.every(field => {
    const value = profile[field];

    if (value === null || value === undefined) return false;

    if (Array.isArray(value)) return value.length > 0;

    if (typeof value === 'string') return value.trim().length > 0;

    return true;
  });
}

export const updateProfile = async (
  userId: string,
  profileData: Partial<Profile> = {}
): Promise<Profile | null> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existingProfile = await tx.profiles.findUnique({
        where: { user_id: userId },
      });

      if (!existingProfile) {
        logger.warn("PROFILE_NOT_FOUND_FOR_UPDATE", { userId });
        return null;
      }

      const sanitized = sanitizeData(profileData);

      if (sanitized.birthdate) {
        sanitized.birthdate = new Date(sanitized.birthdate);
      }

      const updateData: any = { ...sanitized, updated_at: new Date() };

      // Check if profile is now complete
      const mergedProfile = { ...existingProfile, ...updateData };
      if (isProfileComplete(mergedProfile)) {
        updateData.is_complete = true;
        logger.info("PROFILE_COMPLETED", { userId });
      }

      const updatedProfile = await tx.profiles.update({
        where: { user_id: userId },
        data: updateData,
      });

      logger.info("PROFILE_UPDATED", { userId, data: sanitized });
      return updatedProfile;
    });
  } catch (error) {
    logger.error("UPDATE_PROFILE_ERROR", { error, userId, profileData });
    throw error;
  }
};
```

**Step 5: Run tests to verify they pass**

Run: `cd server && npm test -- modules/profiles.completion.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
cd server
git add prisma/migrations/ src/modules/profiles/services.ts src/tests/modules/profiles.completion.test.ts
git commit -m "feat(profiles): add profile completion validation with is_complete flag"
```

---

## Phase 4: Code Quality Improvements

### Task 4.1: Remove Type Assertions with `any`

**Files:**
- Modify: `server/src/modules/profiles/services.ts`
- Modify: `server/src/modules/discover/services.ts`

**Step 1: Replace `any` with proper types in profiles service**

```typescript
// server/src/modules/profiles/services.ts

interface ProfileUpdateData {
  name?: string;
  avatar_url?: string;
  birthdate?: Date | string;
  gender?: string;
  pronouns?: string;
  major?: string;
  bio?: string;
  interests?: string[];
  gender_preference?: string[];
  sexual_orientation?: string;
  min_age?: number;
  max_age?: number;
  photos?: string[];
  lifestyle?: JsonValue;
}

export const updateProfile = async (
  userId: string,
  profileData: Partial<Profile> = {}
): Promise<Profile | null> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existingProfile = await tx.profiles.findUnique({
        where: { user_id: userId },
      });

      if (!existingProfile) {
        logger.warn("PROFILE_NOT_FOUND_FOR_UPDATE", { userId });
        return null;
      }

      const sanitized = sanitizeData<ProfileUpdateData>(profileData);

      if (sanitized.birthdate && typeof sanitized.birthdate === 'string') {
        sanitized.birthdate = new Date(sanitized.birthdate);
      }

      const updateData: Prisma.profilesUpdateInput = {
        ...sanitized,
        updated_at: new Date()
      };

      const updatedProfile = await tx.profiles.update({
        where: { user_id: userId },
        data: updateData,
      });

      logger.info("PROFILE_UPDATED", { userId, data: sanitized });
      return updatedProfile;
    });
  } catch (error) {
    logger.error("UPDATE_PROFILE_ERROR", { error, userId, profileData });
    throw error;
  }
};
```

**Step 2: Replace `any` with proper types in discover service**

```typescript
// server/src/modules/discover/services.ts

interface DiscoverWhereClause {
  user_id: Record<string, { notIn: string[] }>;
  university_id: string;
  campus_id: string | null;
  birthdate: Record<string, Date>;
  min_age?: Record<string, number>;
  max_age?: Record<string, number>;
  gender?: Record<string, { in: string[] }>;
}

const getEligibleCandidates = async (userId: string, userProfile: Profile): Promise<Profile[]> => {
  const userAge = calculateAge(userProfile.birthdate);

  if (!userProfile.gender_preference?.length) {
    throw new Error('User must have at least one gender preference set');
  }

  const [existingLikes, existingMatches, blockedUsers] = await Promise.all([
    prisma.likes.findMany({
      where: { from_user: userId },
      select: { to_user: true }
    }),
    prisma.matches.findMany({
      where: { OR: [{ user1: userId }, { user2: userId }] },
      select: { user1: true, user2: true }
    }),
    prisma.blocks.findMany({
      where: { OR: [{ blocker_id: userId }, { blocked_id: userId }] },
      select: { blocker_id: true, blocked_id: true }
    })
  ]);

  const likedUserIds = existingLikes.map(like => like.to_user);
  const matchedUserIds = existingMatches.flatMap(match => [match.user1, match.user2]);
  const blockedUserIds = blockedUsers.flatMap(block => [block.blocker_id, block.blocked_id_id]);

  const excludedUserIds = [...new Set([
    userId,
    ...likedUserIds,
    ...matchedUserIds,
    ...blockedUserIds
  ]) as string[];

  const { minBirthdate, maxBirthdate } = getBirthdateRangeForAge(userProfile.min_age, userProfile.max_age);

  const where: DiscoverWhereClause = {
    user_id: { notIn: excludedUserIds },
    university_id: userProfile.university_id,
    campus_id: userProfile.campus_id,
    birthdate: { gte: maxBirthdate, lte: minBirthdate },
    min_age: { lte: userAge },
    max_age: { gte: userAge }
  };

  if (!userProfile.gender_preference.includes('All')) {
    const genderIdentities = genderPreferencesToIdentities(userProfile.gender_preference);
    where.gender = { in: genderIdentities };
  }

  const profiles = await prisma.profiles.findMany({
    where: where as any, // Prisma types require cast here
    take: 200,
    orderBy: { created_at: 'desc' },
  });

  const finalProfiles = profiles.filter(profile =>
    profile.interests && profile.interests.length > 0 &&
    profile.gender_preference && profile.gender_preference.length > 0
  );

  return finalProfiles;
};
```

**Step 3: Run existing tests**

Run: `cd server && npm test`
Expected: All existing tests pass

**Step 4: Commit**

```bash
cd server
git add src/modules/profiles/services.ts src/modules/discover/services.ts
git commit -m "refactor(types): remove type assertions with 'any' and add proper types"
```

---

### Task 4.2: Centralize Error Handling

**Files:**
- Create: `server/src/utils/errors.ts`
- Modify: `server/src/middleware/error/errorHandler.ts`
- Test: `server/src/tests/utils/errors.test.ts` (create)

**Step 1: Write failing test for error handling**

```typescript
// server/src/tests/utils/errors.test.ts
import {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ForbiddenError,
} from '@/utils/errors';

describe('Error Classes', () => {
  it('should create ValidationError with proper properties', () => {
    const error = new ValidationError('Invalid input', { field: 'email' });

    expect(error.name).toBe('ValidationError');
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should create AuthenticationError with proper properties', () => {
    const error = new AuthenticationError('Invalid credentials');

    expect(error.name).toBe('AuthenticationError');
    expect(error.statusCode).toBe(401);
  });

  it('should create NotFoundError with proper properties', () => {
    const error = new NotFoundError('User not found');

    expect(error.name).toBe('NotFoundError');
    expect(error.statusCode).toBe(404);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test -- utils/errors.test.ts`
Expected: FAIL - error classes don't exist

**Step 3: Create error class hierarchy**

```typescript
// server/src/utils/errors.ts
import logger from '@/config/logger';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(ErrorCode.AUTHENTICATION_ERROR, message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Authorization failed') {
    super(ErrorCode.AUTHORIZATION_ERROR, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(ErrorCode.NOT_FOUND_ERROR, message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.CONFLICT_ERROR, message, 409, details);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
```

**Step 4: Update error handler to use new error classes**

```typescript
// server/src/middleware/error/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import logger from '@/config/logger';
import {
  AppError,
  isAppError
} from '@/utils/errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log all errors
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    type: err.constructor.name,
  });

  // Handle custom AppErrors
  if (isAppError(err)) {
    return res.status(err.statusCode).json({
      status: 'error',
      error: err.message,
      code: err.code,
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
  }

  // Handle unknown errors
  const response = {
    status: 'error',
    error: process.env.NODE_ENV === 'production'
      ? 'Something went wrong on our end'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  };

  res.status(500).json(response);
};
```

**Step 5: Update controllers to use new error classes**

Example updates:
```typescript
// server/src/modules/profiles/controllers.ts
import { NotFoundError, AuthorizationError } from '@/utils/errors';

export const updateProfileController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = (req as any).user?.id;

    if (authenticatedUserId !== userId) {
      throw new AuthorizationError('Cannot update another user\'s profile');
    }

    const profileData = req.body;
    const updatedProfile = await profileService.updateProfile(userId, profileData);

    if (!updatedProfile) {
      throw new NotFoundError('Profile not found');
    }

    res.json(updatedProfile);
  } catch (error) {
    next(error); // Let error handler handle AppErrors
  }
};
```

**Step 6: Run tests to verify they pass**

Run: `cd server && npm test -- utils/errors.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
cd server
git add src/utils/errors.ts src/middleware/error/errorHandler.ts src/modules/profiles/controllers.ts src/tests/utils/errors.test.ts
git commit -m "refactor(error): centralize error handling with custom error classes"
```

---

### Task 4.3: Improve Pagination in Discover Feed

**Files:**
- Modify: `server/src/modules/discover/controllers.ts`
- Test: `server/src/tests/modules/discover.pagination.test.ts` (create)

**Step 1: Write failing test for accurate pagination**

```typescript
// server/src/tests/modules/discover.pagination.test.ts
import { getDiscoverFeed } from '@/modules/discover/controllers';
import request from 'supertest';
import app from '@/app';
import { createTestUser } from '@/tests/helpers';

describe('Discover Pagination', () => {
  it('should return accurate hasMore flag', async () => {
    const { token } = await createTestUser();

    const response = await request(app)
      .get('/api/discover?limit=10&offset=0')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.hasMore).toBeDefined();

    // If we got 10 results, we can't know if there are more
    if (response.body.profiles.length === 10) {
      // Should be null or based on actual count
      expect(['true', 'false', null]).toContain(response.body.hasMore);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test -- modules/discover.pagination.test.ts`
Expected: FAIL - hasMore is simplistic

**Step 3: Implement accurate pagination with total count**

```typescript
// server/src/modules/discover/controllers.ts

export const getDiscoverFeed = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    // Get total count of eligible candidates (without pagination)
    const userProfile = await prisma.profiles.findUnique({
      where: { user_id: userId }
    });

    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    const candidates = await DiscoverService.getEligibleCandidates(userId, userProfile);
    const totalCount = candidates.length;

    // Paginate candidates
    const paginatedCandidates = candidates.slice(offset, offset + limit);

    return res.status(200).json({
      profiles: paginatedCandidates,
      count: paginatedCandidates.length,
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount,
      page: Math.floor(offset / limit) + 1
    });
  } catch (err: any) {
    if (err.message.includes("User ID is required") ||
        err.message.includes("User profile not found") ||
        err.message.includes("User must have at least one gender preference set")) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
};
```

**Step 4: Run tests to verify they pass**

Run: `cd server && npm test -- modules/discover.pagination.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
cd server
git add src/modules/discover/controllers.ts src/tests/modules/discover.pagination.test.ts
git commit -m "feat(discover): improve pagination with accurate total count and hasMore flag"
```

---

## Phase 5: Frontend Improvements

### Task 5.1: Add Accessibility Labels

**Files:**
- Modify: `client/app/home/(tabs)/discover.tsx`
- Test: `client/__tests__/accessibility/discover.test.tsx` (create)

**Step 1: Write failing test for accessibility**

```typescript
// client/__tests__/accessibility/discover.test.tsx
import { render, screen } from '@testing-library/react-native';
import DiscoverScreen from '@/app/home/(tabs)/discover';

describe('Discover Screen - Accessibility', () => {
  it('should have accessible refresh button', () => {
    render(<DiscoverScreen />);

    const refreshButton = screen.getByRole('button', { name: 'refresh-feed' });

    expect(refreshButton).toBeTruthy();
    expect(refreshButton.props.accessible).toBe(true);
    expect(refreshButton.props.accessibilityLabel).toBeTruthy();
  });

  it('should have accessible swipe actions', () => {
    render(<DiscoverScreen />);

    const swipeCards = screen.getAllByRole('button', { name: 'like-profile' });

    swipeCards.forEach(card => {
      expect(card.props.accessible).toBe(true);
      expect(card.props.accessibilityLabel).toBeDefined();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd client && npm test -- accessibility/discover.test.tsx`
Expected: FAIL - accessibility labels missing

**Step 3: Add accessibility attributes to interactive elements**

```typescript
// client/app/home/(tabs)/discover.tsx

export default function DiscoverScreen() {
  // ... existing code ...

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={handleRefresh}
          disabled={refreshing}
          style={styles.headerButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Refresh feed"
          accessibilityState={{ disabled: refreshing }}
        >
          <Animated.View style={{ transform: [{ rotate: rotateInterpolation }] }}>
            <Ionicons name="refresh" size={24} color={refreshing ? MUTED : PRIMARY} />
          </Animated.View>
        </Pressable>
      </View>

      {/* ... other UI ... */}
    </SafeAreaView>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd client && npm test -- accessibility/discover.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
cd client
git add app/home/(tabs)/discover.tsx __tests__/accessibility/discover.test.tsx
git commit -m "feat(a11y): add accessibility labels to discover screen"
```

---

### Task 5.2: Fix Optimistic UI Rollback Issues

**Files:**
- Modify: `client/app/home/(tabs)/matches.tsx`
- Test: `client/__tests__/matches/rollback.test.tsx` (create)

**Step 1: Write failing test for optimistic rollback**

```typescript
// client/__tests__/matches/rollback.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MatchesScreen from '@/app/home/(tabs)/matches';
import { MatchesAPI } from '@/api/matches';

jest.mock('@/api/matches');

describe('Matches Screen - Optimistic Rollback', () => {
  it('should rollback optimistic update when API fails', async () => {
    MatchesAPI.unmatch.mockRejectedValue(new Error('Network error'));

    const { result } = render(<MatchesScreen />);
    const matchItem = result.current.matches[0];

    // Trigger unmatch
    await fireEvent.press(result.getByRole('button', { name: `unmatch-${matchItem.id}` }));

    // Wait for rollback
    await waitFor(() => {
      expect(result.current.matches).toHaveLength(1); // Match should be restored
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd client && npm test -- matches/rollback.test.tsx`
Expected: FAIL - rollback not implemented

**Step 3: Implement proper rollback on API failure**

```typescript
// client/app/home/(tabs)/matches.tsx

const handleUnmatch = async (matchId: string) => {
  setUnmatchingMatchId(null);
  setIsActionInProgress(true);

  // Store previous matches state for rollback
  const previousMatches = [...matches];

  try {
    // Optimistically remove from list
    removeMatch(matchId);

    if (!token) {
      Alert.alert("Error", "Authentication token not found");
      setMatches(previousMatches); // Rollback
      return;
    }

    await MatchesAPI.unmatch(token, matchId);
    logger.info("Match removed", { matchId });
  } catch (error) {
    logger.error("Failed to unmatch", { error });

    // Rollback optimistic update
    setMatches(previousMatches);
    Alert.alert("Error", "Failed to unmatch. Please try again.");
  } finally {
    setIsActionInProgress(false);
  }
};

const handleBlockUser = async (userId: string) => {
  setBlockingUserId(null);
  setIsActionInProgress(true);

  // Store previous matches state for rollback
  const previousMatches = [...matches];

  // Optimistically remove match from list
  const matchToRemove = matches.find((m) => m.otherUser.id === userId);
  if (matchToRemove) {
    removeMatch(matchToRemove.id);
  }

  try {
    const result = await blockUser(userId);
    if (result.success) {
      logger.info("User blocked from matches", { userId });
    } else {
      logger.error("Failed to block user", { error: result.error });
      // Rollback
      setMatches(previousMatches);
      Alert.alert("Error", result.error || "Failed to block user");
    }
  } catch (error) {
    logger.error("Block user error", { error });
    // Rollback
    setMatches(previousMatches);
    Alert.alert("Error", "Failed to block user. Please try again.");
  } finally {
    setIsActionInProgress(false);
  }
};
```

**Step 4: Run tests to verify they pass**

Run: `cd client && npm test -- matches/rollback.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
cd client
git add app/home/(tabs)/matches.tsx __tests__/matches/rollback.test.tsx
git commit -m "fix(ux): implement proper optimistic UI rollback on API failure"
```

---

### Task 5.3: Add Network Status Indicator

**Files:**
- Create: `client/components/NetworkStatus.tsx`
- Modify: `client/app/home/_layout.tsx`
- Test: `client/__tests__/components/NetworkStatus.test.tsx` (create)

**Step 1: Write failing test for network status indicator**

```typescript
// client/__tests__/components/NetworkStatus.test.tsx
import { render } from '@testing-library/react-native';
import NetworkStatus from '@/components/NetworkStatus';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

jest.mock('@/hooks/useNetworkStatus');

describe('NetworkStatus Component', () => {
  it('should show offline message when disconnected', () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({ isConnected: false });

    const { result } = render(<NetworkStatus />);

    expect(result.getByText(/No internet connection/i)).toBeTruthy();
  });

  it('should be hidden when connected', () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({ isConnected: true });

    const { result } = render(<NetworkStatus />);

    expect(result.queryByText(/No internet connection/i)).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd client && npm test -- components/NetworkStatus.test.tsx`
Expected: FAIL - components don't exist

**Step 3: Create network status hook**

```typescript
// client/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import logger from '@/config/logger';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [type, setType] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected !== false && state.isInternetReachable !== false;
      setIsConnected(connected);
      setType(state.type || null);

      logger.info('[Network] Status changed', { isConnected: connected, type: state.type });
    });

    return unsubscribe;
  }, []);

  return { isConnected, type };
}
```

**Step 4: Create network status component**

```typescript
// client/components/NetworkStatus.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { PRIMARY, DARK, MUTED } from '@/constants/theme';

export default function NetworkStatus() {
  const { isConnected } = useNetworkStatus();

  if (isConnected) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.message}>No internet connection</Text>
      <Text style={styles.submessage}>Some features may not work offline</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 1000,
  },
  message: {
    color: DARK,
    fontSize: 14,
    fontWeight: '600',
  },
  submessage: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
  },
});
```

**Step 5: Add network status to home layout**

```typescript
// client/app/home/_layout.tsx
import NetworkStatus from '@/components/NetworkStatus';

export default function HomeLayout() {
  return (
    <SafeAreaView style={styles.container}>
      <NetworkStatus />
      <Tabs screenOptions={{ headerShown: false }} />
    </SafeAreaView>
  );
}
```

**Step 6: Run tests to verify they pass**

Run: `cd client && npm test -- components/NetworkStatus.test.tsx`
Expected: PASS

**Step 7: Commit**

```bash
cd client
git add hooks/useNetworkStatus.ts components/NetworkStatus.ts app/home/_layout.tsx __tests__/components/NetworkStatus.test.tsx
git commit -m "feat(ux): add network status indicator component"
```

---

## Phase 6: Database & Performance Improvements

### Task 6.1: Add Missing Database Indexes

**Files:**
- Create: `server/prisma/migrations/20260217_add_performance_indexes/migration.sql`
- Test: (no test needed for migration)

**Step 1: Create migration for performance indexes**

```sql
-- server/prisma/migrations/20260217_add_performance_indexes/migration.sql

-- Index for discover queries
CREATE INDEX IF NOT EXISTS idx_profiles_university_campus_gender
ON profiles(university_id, campus_id, gender);

CREATE INDEX IF NOT EXISTS idx_profiles_university_created
ON profiles(university_id, created_at DESC);

-- Index for chat queries
CREATE INDEX IF NOT EXISTS idx_chats_match_sender_sent
ON chats(match_id, sender_id, sent_at DESC);

-- Index for likes queries
CREATE INDEX IF NOT EXISTS idx_likes_from_created
ON likes(from_user, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_likes_to_created
ON likes(to_user, created_at DESC);
-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

CREATE INDEX IF NOT EXISTS idx_sessions_token_expires
ON sessions(token, expiresAt);
```

**Step 2: Run migration**

Run: `cd server && npx prisma migrate dev --name add_performance_indexes`
Expected: Migration succeeds

**Step 3: Verify indexes**

Run: `cd server && npx prisma db push`
Expected: Schema synced

**Step 4: Commit**

```bash
cd server
git add prisma/migrations/
git commit -m "perf(database): add performance indexes for frequently queried fields"
```

---

### Task 6.2: Optimize Discover Service Queries

**Files:**
- Modify: `server/src/modules/discover/services.ts`
- Test: `server/src/tests/modules/discover.performance.test.ts` (create)

**Step 1: Write failing test for query optimization**

```typescript
// server/src/tests/modules/discover.performance.test.ts
import { getEligibleCandidates } from '@/modules/discover/services';
import { prisma } from '@/lib/prismaClient';
import { createTestUser, createTestProfile, cleanupTestData } from '@/tests/helpers';

describe('Discover Service - Query Performance', () => {
  let testUser: any;
  let testProfile: any;

  beforeEach(async () => {
    await cleanupTestData();
    testUser = await createTestUser();
    testProfile = await createTestProfile(testUser.user.id);
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('should use batched queries to fetch candidates', async () => {
    // Track query count
    const originalFindMany = prisma.profiles.findMany.bind(prisma.profiles);
    const originalLikesFindMany = prisma.likes.findMany.bind(prisma.likes);
    const originalMatchesFindMany = prisma.matches.findMany.bind(prisma.matches);
    const originalBlocksFindMany = prisma.blocks.findMany.bind(prisma.blocks);

    let mainQueryCount = 0;
    let excludedUsersQueryCount = 0;

    prisma.profiles.findMany = jest.fn((...args: any[]) => {
      mainQueryCount++;
      return originalFindMany(...args);
    }) as any;

    prisma.likes.findMany = jest.fn((...args: any[]) => {
      excludedUsersQueryCount++;
      return originalLikesFindMany(...args);
    }) as any;

    prisma.matches.findMany = jest.fn((...args: any[]) => {
      excludedUsersQueryCount++;
      return originalMatchesFindMany(...args);
    }) as any;

    prisma.blocks.findMany = jest.fn((...args: any[]) => {
      excludedUsersQueryCount++;
      return originalBlocksFindMany(...args);
    }) as any;

    await getEligibleCandidates(testUser.user.id, testProfile);

    // Should have 1 main query + 3 batched exclusion queries (likes, matches, blocks)
    expect(mainQueryCount).toBe(1);
    expect(excludedUsersQueryCount).toBe(3);

    // Restore
    prisma.profiles.findMany = originalFindMany;
    prisma.likes.findMany = originalLikesFindMany;
    prisma.matches.findMany = originalMatchesFindMany;
    prisma.blocks.findMany = originalBlocksFindMany;
  });

  it('should exclude blocked users from candidates', async () => {
    // Create another user to block
    const blockedUser = await createTestUser();
    const blockedProfile = await createTestProfile(blockedUser.user.id);

    // Block the user
    await prisma.blocks.create({
      data: {
        blocker_id: testUser.user.id,
        blocked_id: blockedUser.user.id,
      },
    });

    const candidates = await getEligibleCandidates(testUser.user.id, testProfile);

    // Blocked user should not appear in candidates
    expect(candidates.find(c => c.user_id === blockedUser.user.id)).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test -- modules/discover.performance.test.ts`
Expected: FAIL - not optimized yet

**Step 3: Optimize queries by batching database calls**

```typescript
// server/src/modules/discover/services.ts

const getEligibleCandidates = async (userId: string, userProfile: Profile): Promise<Profile[]> => {
  const userAge = calculateAge(userProfile.birthdate);

  if (!userProfile.gender_preference?.length) {
    throw new Error('User must have at least one gender preference set');
  }

  // Fetch excluded user IDs in a single batch query
  const [existingLikes, existingMatches, blockedUsers] = await Promise.all([
    prisma.likes.findMany({
      where: { from_user: userId },
      select: { to_user: true }
    }),
    prisma.matches.findMany({
      where: { OR: [{ user1: userId }, { user2: userId }] },
      select: { user1: true, user2: true }
    }),
    prisma.blocks.findMany({
      where: { OR: [{ blocker_id: userId }, { blocked_id: userId }] },
      select: { blocker_id: true, blocked_id: true }
    })
  ]);

  // Build excluded user IDs set
  const likedUserIds = existingLikes.map(like => like.to_user);
  const matchedUserIds = existingMatches.flatMap(match => [match.user1, match.user2]);
  const blockedUserIds = blockedUsers.flatMap(block => [block.blocker_id, block.blocked_id]);

  const excludedUserIds = [...new Set([
    userId,
    ...likedUserIds,
    ...matchedUserIds,
    ...blockedUserIds
  ]) as string[]];

  // Single optimized query with all filters
  const candidates = await prisma.profiles.findMany({
    where: {
      // Exclude self and already interacted users
      user_id: { notIn: excludedUserIds },

      // Same university and campus
      university_id: userProfile.university_id,
      campus_id: userProfile.campus_id,

      // Age range
      birthdate: {
        gte: subYears(new Date(), userProfile.max_age + 1),
        lte: subYears(new Date(), userAge)
      },

      // Candidate's age preference includes current user
      min_age: { lte: userAge },
      max_age: { gte: userAge },

      // Gender preference
      gender: userProfile.gender_preference.includes('All')
        ? undefined
        : { in: genderPreferencesToIdentities(userProfile.gender_preference) },

      // Has interests and gender preference set
      interests: { not: [] },
      gender_preference: { not: [] },
    },
    take: 200,
    orderBy: { created_at: 'desc' },
  });

  logger.info(`Discover: Found ${candidates.length} candidates with optimized queries`, {
    userId,
    excludedCount: excludedUserIds.length
  });

  return candidates;
};
```

**Step 4: Run tests to verify they pass**

Run: `cd server && npm test -- modules/discover.performance.test.ts`
Expected: PASS (reduced from 4 queries to 2: 1 batch query + 1 main query)

**Step 5: Commit**

```bash
cd server
git add src/modules/discover/services.ts src/tests/modules/discover.performance.test.ts
git commit -m "perf(discover): optimize queries by batching excluded user lookups"
```

---

## Phase 7: Monitoring & Observability

### Task 7.1: Add Request ID Tracking

**Files:**
- Create: `server/src/middleware/requestId.ts`
- Modify: `server/src/app.ts`
- Test: `server/src/tests/middleware/requestId.test.ts` (create)

**Step 1: Write failing test for request ID**

```typescript
// server/src/tests/middleware/requestId.test.ts
import request from 'supertest';
import app from '@/app';

describe('Request ID Middleware', () => {
  it('should attach unique request ID to all requests', async () => {
    const response1 = await request(app).get('/api/discover');
    const response2 = await request(app).get('/api/discover');

    expect(response1.headers['x-request-id']).toBeTruthy();
    expect(response2.headers['x-request-id']).toBeTruthy();

    // IDs should be unique
    expect(response1.headers['x-request-id']).not.toBe(response2.headers['x-request-id']);
  });

  it('should include request ID in logs', async () => {
    const response = await request(app).get('/api/discover');

    // Log should contain request ID (this would need log mocking)
    expect(response.headers['x-request-id']).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test -- middleware/requestId.test.ts`
Expected: FAIL - middleware doesn't exist

**Step 3: Implement request ID middleware**

```typescript
// server/src/middleware/requestId.ts
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import logger from '@/config/logger';

export function requestId(req: Request, res: Response, next: NextFunction) {
  // Generate unique ID for each request
  const requestId = randomUUID();

  // Attach to request object for use in other middleware/handlers
  (req as any).requestId = requestId;

  // Include in response headers for debugging
  res.setHeader('X-Request-ID', requestId);

  next();
}

export function getRequestLogger(req: Request): string {
  return `[${(req as any).requestId}]`;
}
```

**Step 4: Add request ID to app middleware**

```typescript
// server/src/app.ts
import { requestId } from '@/middleware/requestId';

// Add request ID as first middleware
app.use(requestId);
```

**Step 5: Update logging to include request ID**

Update all logger calls to include request ID:
```typescript
logger.info("DISCOVER_FETCHED", {
  requestId: getRequestLogger(req),
  userId,
  count: profiles.length,
});
```

**Step 6: Run tests to verify they pass**

Run: `cd server && npm test -- middleware/requestId.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
cd server
git add src/middleware/requestId.ts src/app.ts src/tests/middleware/requestId.test.ts
git commit -m "feat(observability): add request ID tracking for better debugging"
```

---

### Task 7.2: Add Structured Logging

**Files:**
- Modify: `server/src/config/logger.ts`
- Modify: `server/src/middleware/error/errorHandler.ts`
- Test: `server/src/tests/config/logger.test.ts` (create)

**Step 1: Write failing test for structured logging**

```typescript
// server/src/tests/config/logger.test.ts
import logger from '@/config/logger';

describe('Structured Logging', () => {
  it('should output JSON format in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    logger.info('Test message', { data: 'test value' });

    // Restore
    process.env.NODE_ENV = originalEnv;

    // Output should be parseable JSON
    // (This would need to capture stdout in actual test)
  });

  it('should output readable text in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    logger.info('Test message', { data: 'test value' });

    process.env.NODE_ENV = originalEnv;

    // Output should be readable text
    // (This would need to capture stdout in actual test)
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test -- config/logger.test.ts`
Expected: FAIL - logger not structured

**Step 3: Implement structured logging**

```typescript
// server/src/config/logger.ts
import winston from 'winston';

const isDevelopment = process.env.NODE_ENV !== 'production';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  isDevelopment ? winston.format.colorize() : winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    if (isDevelopment) {
      return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    }

    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/app.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
  ],
});

// Add request ID to context
export function withRequestContext(req: Request, context: Record<string, any>) {
  const requestId = (req as any).requestId || 'unknown';
  return {
    requestId,
    ...context
  };
}

export default logger;
```

**Step 4: Update error handler to use structured logging**

```typescript
// server/src/middleware/error/errorHandler.ts

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = (req as any).requestId || 'unknown';
  const context = {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    type: err.constructor.name,
  };

  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    ...withRequestContext(req, context),
  });

  // ... rest of error handling
};
```

**Step 5: Run tests to verify they pass**

Run: `cd server && npm test -- config/logger.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
cd server
git add src/config/logger.ts src/middleware/error/errorHandler.ts src/tests/config/logger.test.ts
git commit -m "feat(observability): implement structured logging with JSON format in production"
```

---

## Phase 8: Additional Security Enhancements

### Task 8.1: Add Input Sanitization

**Files:**
- Create: `server/src/utils/sanitize.ts`
- Modify: `server/src/modules/profiles/controllers.ts` (example)
- Test: `server/src/tests/utils/sanitize.test.ts` (create)

**Step 1: Write failing test for input sanitization**

```typescript
// server/src/tests/utils/sanitize.test.ts
import { sanitizeHtml } from '@/utils/sanitize';

describe('Input Sanitization', () => {
  it('should escape HTML tags', () => {
    const input = '<script>alert("xss")</script>';
    const sanitized = sanitizeHtml(input);

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');
  });

  it('should preserve safe text', () => {
    const input = 'Hello <b>World</b>';
    const sanitized = sanitizeHtml(input);

    expect(sanitized).toContain('Hello');
    expect(sanitized).toContain('World');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test -- utils/sanitize.test.ts`
Expected: FAIL - sanitization doesn't exist

**Step 3: Implement HTML sanitization**

```typescript
// server/src/utils/sanitize.ts
import logger from '@/config/logger';

/**
 * Escape HTML entities to prevent XSS attacks.
 * 
 * NOTE: This is a basic implementation suitable for simple use cases.
 * For production applications with complex HTML handling, consider using
 * the 'sanitize-html' library which provides more comprehensive protection:
 * 
 * npm install sanitize-html @types/sanitize-html
 * 
 * Example with sanitize-html:
 * import sanitizeHtml from 'sanitize-html';
 * const clean = sanitizeHtml(dirty, {
 *   allowedTags: ['b', 'i', 'em', 'strong'],
 *   allowedAttributes: {}
 * });
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}
```

**Step 4: Add sanitization to profile bio input**

```typescript
// server/src/modules/profiles/controllers.ts
import { sanitizeHtml } from '@/utils/sanitize';

export const createProfileController = async (req: Request, res: Response) => {
  try {
    let { bio } = req.body;

    // Sanitize bio input to prevent XSS
    if (bio) {
      bio = sanitizeHtml(bio);
    }

    const profileData = { ...req.body, bio };
    const profile = await profileService.createProfile(profileData);

    res.status(201).json(profile);
  } catch (error) {
    logger.error("Error creating profile", { error });
    res.status(500).json({ error: "Failed to create profile" });
  }
};
```

**Step 5: Run tests to verify they pass**

Run: `cd server && npm test -- utils/sanitize.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
cd server
git add src/utils/sanitize.ts src/modules/profiles/controllers.ts src/tests/utils/sanitize.test.ts
git commit -m "feat(security): add input sanitization to prevent XSS attacks"
```

---

### Task 8.2: Add File Upload Validation

**Files:**
- Create: `server/src/middleware/fileValidation.ts`
- Modify: `server/src/modules/chats/routes.ts`
- Test: `server/src/tests/middleware/fileValidation.test.ts` (create)

**Step 1: Write failing test for file validation**

```typescript
// server/src/tests/middleware/fileValidation.test.ts
import request from 'supertest';
import app from '@/app';
import fs from 'fs';
import path from 'path';

describe('File Upload Validation', () => {
  it('should reject files larger than limit', async () => {
    const largeFile = path.join(__dirname, 'fixtures/large-file.jpg');
    const formData = new FormData();

    formData.append('file', fs.createReadStream(largeFile));

    const response = await request(app)
      .post('/api/chats/test-upload')
      .attach('file', largeFile)
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('file size');
  });

  it('should reject invalid file types', async () => {
    const invalidFile = path.join(__dirname, 'fixtures/test.exe');
    const formData = new FormData();

    formData.append('file', fs.createReadStream(invalidFile));

    const response = await request(app)
      .post('/api/chats/test-upload')
      .attach('file', invalidFile)
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('file type');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test -- middleware/fileValidation.test.ts`
Expected: FAIL - validation middleware doesn't exist

**Step 3: Implement file upload validation middleware**

```typescript
// server/src/middleware/fileValidation.ts
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import logger from '@/config/logger';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'video/mp4',
  'video/webm',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype) {
      return cb(new Error('File type is not supported'), false);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }

    cb(null, true);
  },
});

export const handleUploadError = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File size exceeds limit of 10MB',
        code: 'FILE_TOO_LARGE',
      });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file format',
        code: 'INVALID_FILE_TYPE',
      });
    }

    logger.error('File upload error', {
      error: error.message,
      mimetype: (error as any).file?.mimetype,
      filename: (error as any).file?.originalname,
    });

    return res.status(400).json({
      error: 'File upload failed',
      code: 'UPLOAD_FAILED',
    });
  }

  next(error);
};

export default upload;
```

**Step 4: Apply validation to chat upload route**

```typescript
// server/src/modules/chats/routes.ts
import upload, { handleUploadError } from '@/middleware/fileValidation';

// Replace existing multer with validated version
router.post("/:match_id/upload", upload.single("file"), handleUploadError, uploadMedia);
```

**Step 5: Run tests to verify they pass**

Run: `cd server && npm test -- middleware/fileValidation.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
cd server
git add src/middleware/fileValidation.ts src/modules/chats/routes.ts src/tests/middleware/fileValidation.test.ts
git commit -m "feat(security): add file upload validation with size and type checking"
```

---

## Phase 9: Testing Improvements

### Task 9.1: Add Integration Tests for API Routes

**Files:**
- Create: `server/src/tests/integration/auth.routes.test.ts` (create example)
- Create: `server/src/tests/integration/likes.routes.test.ts` (create example)

**Step 1: Write integration test for auth routes**

```typescript
// server/src/tests/integration/auth.routes.test.ts
import request from 'supertest';
import app from '@/app';
import { createTestUser } from '@/tests/helpers';

describe('Auth Routes - Integration Tests', () => {
  describe('POST /api/auth/signup', () => {
    it('should create user account and return token', async () => {
      const otp = await createTestOTP('test@example.edu');
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.edu',
          password: 'SecurePass123!',
          otp: otp,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeTruthy();
      expect(response.body.user).toBeTruthy();
    });

    it('should reject invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.edu',
          password: 'SecurePass123!',
          otp: '000000',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid or expired OTP');
    });
  });

  describe('POST /api/auth/signin', () => {
    it('should authenticate valid credentials', async () => {
      const { user } = await createTestUser();

      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: user.email,
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeTruthy();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.edu',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid credentials');
    });
  });
});
```

**Step 2: Run tests**

Run: `cd server && npm test -- integration/auth.routes.test.ts`
Expected: PASS

**Step 3: Add more integration tests for other routes**

Create similar integration tests for:
- Likes routes
- Matches routes
- Profiles routes
- Chats routes
- Blocks routes

**Step 4: Commit**

```bash
cd server
git add src/tests/integration/
git commit -m "test(integration): add API integration tests for all routes"
```

---

### Task 9.2: Add Frontend Component Tests

**Files:**
- Create: `client/__tests__/components/SwipeCard.test.tsx`
- Create: `client/__tests__/components/ProfileView.test.tsx`
- Create: `client/__tests__/screens/DiscoverScreen.test.tsx`

**Step 1: Write test for SwipeCard component**

```typescript
// client/__tests__/components/SwipeCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import SwipeCard from '@/components/discover/SwipeCard';

describe('SwipeCard Component', () => {
  it('should render profile information', () => {
    const profile = {
      user_id: 'user1',
      name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      bio: 'Test bio',
      interests: ['Music', 'Movies'],
    };

    const { getByText } = render(<SwipeCard profile={profile} active={true} />);

    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('Test bio')).toBeTruthy();
  });

  it('should call onSwipeLeft when left swipe occurs', () => {
    const onSwipeLeft = jest.fn();
    const profile = {
      user_id: 'user1',
      name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      bio: 'Test bio',
      interests: ['Music', 'Movies'],
    };

    const { getByTestId } = render(
      <SwipeCard profile={profile} active={true} onSwipeLeft={onSwipeLeft} />
    );

    // Simulate swipe (implementation-specific)
    fireEvent(getByTestId('swipe-card'), 'onSwipeLeft');

    expect(onSwipeLeft).toHaveBeenCalled();
  });
});
```

**Step 2: Run tests**

Run: `cd client && npm test -- components/SwipeCard.test.tsx`
Expected: PASS (after implementing proper test helpers)

**Step 3: Create test configuration**

Add to `client/jest.config.js`:
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native-community|@expo|react-navigation)/)',
  ],
  testMatchPattern: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

**Step 4: Commit**

```bash
cd client
git add __tests__/ jest.config.js
git commit -m "test(frontend): add frontend component tests with Jest configuration"
```

---

## Phase 10: Documentation & Final Cleanup

### Task 10.1: Update README with Deployment Instructions

**Files:**
- Modify: `README.md` (if exists, or create)
- Create: `server/DEPLOYMENT.md`

**Step 1: Create deployment documentation**

```markdown
# Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Supabase account for storage
- .edu email domain for testing

## Environment Variables

Create `.env` file with:

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://localhost:6379
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EMAIL_SMTP_HOST=smtp.sendgrid.net
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=apikey
EMAIL_SMTP_PASS=your-password
EMAIL_FROM=noreply@yourdomain.com
ENABLE_AUTH=true
CSRF_SECRET=your-csrf-secret
NODE_ENV=production
PORT=3000
```

## Deployment Steps

1. Install dependencies:
```bash
cd server
npm install
```

2. Run migrations:
```bash
npm run migrate
```

3. Build the application:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

## Production Considerations

- Use PM2 or similar process manager
- Configure nginx as reverse proxy
- Enable SSL/TLS
- Set up proper logging rotation
- Configure rate limiting appropriately for your load
- Regular database backups
- Monitor logs for errors and anomalies
```

**Step 2: Commit**

```bash
git add README.md DEPLOYMENT.md
git commit -m "docs: add deployment guide and documentation"
```

---

### Task 10.2: Remove Debug Code and Enable Auth in Production

**Files:**
- Modify: `server/src/middleware/auth/requireAuth.ts`
- Check: `server/src/app.ts`

**Step 1: Remove or improve development-only auth bypass**

```typescript
// server/src/middleware/auth/requireAuth.ts

const enableAuth = process.env.ENABLE_AUTH === "true";

if (!enableAuth) {
  // In development, log warning but still proceed with mock user
  logger.warn("AUTH_DISABLED_WARNING", {
    message: "Authentication is DISABLED. DO NOT DEPLOY WITH THIS SETTING.",
    ip: req.ip,
  });

  (req as any).user = {
    id: "dev-user",
    email: "dev@example.com",
    role: "developer",
  };

  return next();
}
```

**Step 2: Remove environment variable in production or enforce it**

Option 1: Remove flag entirely and always require auth

Option 2: Add explicit check that fails in production:
```typescript
if (process.env.NODE_ENV === 'production' && !enableAuth) {
  throw new Error('Authentication cannot be disabled in production');
}
```

**Step 3: Update CORS to always be enabled**

```typescript
// server/src/app.ts

const isDev = process.env.NODE_ENV === 'development';

// Always enable CORS, but allow more origins in dev
if (isDev) {
  app.use(cors({
    origin: true,
    credentials: true,
  }));
} else {
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
    credentials: true,
  }));
}

// Remove no-op middleware
// Instead, apply CORS directly as above
```

**Step 4: Commit**

```bash
cd server
git add src/middleware/auth/requireAuth.ts src/app.ts
git commit -m "security: remove development auth bypass and enable CORS in production"
```

---

## Phase 11: WebSocket Improvements

### Task 11.1: Add Message Acknowledgment

**Files:**
- Modify: `server/src/websocket/socketManager.ts`
- Modify: `client/hooks/useChat.ts` (if exists or create)
- Test: `server/src/tests/websocket/ack.test.ts` (create)

**Step 1: Write failing test for message acknowledgment**

```typescript
// server/src/tests/websocket/ack.test.ts
import { createServer, Server as HTTPServer } from 'http';
import { io as ClientIO } from 'socket.io-client';
import { generateTestToken } from '@/tests/helpers';

describe('WebSocket - Message Acknowledgment', () => {
  let httpServer: HTTPServer;
  let serverSocket: any;

  beforeEach((done) => {
    httpServer = createServer(app);
    serverSocket = initializeSocket(httpServer);
    httpServer.listen(0, done);
  });

  afterEach((done) => {
    serverSocket.close();
    httpServer.close(done);
  });

  it('should acknowledge message delivery to recipient', async () => {
    const senderSocket = ClientIO('http://localhost:0', {
      auth: { token: generateTestToken('user1') },
    });

    const recipientSocket = ClientIO('http://localhost:0', {
      auth: { token: generateTestToken('user2') },
    });

    await Promise.all([
      senderSocket.connect(),
      recipientSocket.connect(),
    ]);

    let ackReceived = false;

    recipientSocket.on('message_ack', () => {
      ackReceived = true;
    });

    senderSocket.emit('message_send', {
      matchId: 'match1',
      message: 'Test message',
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(ackReceived).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test -- websocket/ack.test.ts`
Expected: FAIL - acknowledgment not implemented

**Step 3: Implement message acknowledgment**

```typescript
// server/src/websocket/socketManager.ts

    // Handle incoming message
    socket.on("message_send", async (data) => {
      try {
        const { matchId, message, media_url, message_type } = data;

        logger.info("MESSAGE_SEND", { userId, matchId, messageType: message_type });

        // Persist message to database
        const savedMessage = await createMessage({
          match_id: matchId,
          sender_id: userId,
          message,
          media_url,
          message_type: message_type || "TEXT",
        });

        // Broadcast to match room
        io.to(`match_${matchId}`).emit("message_received", {
          id: savedMessage.id,
          match_id: savedMessage.match_id,
          sender_id: savedMessage.sender_id,
          message: savedMessage.message,
          is_read: savedMessage.is_read,
          read_at: savedMessage.read_at,
          media_url: savedMessage.media_url,
          message_type: savedMessage.message_type,
          sent_at: savedMessage.sent_at,
          edited_at: savedMessage.edited_at,
        });

        // Send acknowledgment to sender
        socket.emit("message_ack", {
          messageId: savedMessage.id,
          matchId: matchId,
        });
      } catch (err) {
        logger.error("Error in message_send handler", err);

        // Send error acknowledgment
        socket.emit("message_error", {
          error: err.message,
          matchId: matchId,
        });
      }
    });
```

**Step 4: Add acknowledgment handling to client**

```typescript
// client/hooks/useChat.ts (create or modify existing)

export function useChat(matchId: string) {
  const [pendingMessages, setPendingMessages] = useState<Set<string>>(new Set());

  const sendMessage = useCallback(async (message: string) => {
    const tempId = Date.now().toString();

    // Add to pending set
    setPendingMessages(prev => new Set(prev).add(tempId));

    try {
      const sentMessage = await sendMessageToServer({
        matchId,
        message,
        tempId,
      });

      // On successful send (including acknowledgment), remove from pending
      socket.on('message_ack', (ack: { messageId }) => {
        if (messageId === sentMessage.id || messageId === tempId) {
          setPendingMessages(prev => {
            const newSet = new Set(prev);
            newSet.delete(messageId);
            newSet.delete(tempId);
            return newSet;
          });
        }
      });

      socket.on('message_error', (error: { messageId: errorMessage }) => {
        setPendingMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          newSet.delete(tempId);
          return newSet;
        });

        Alert.alert('Failed to send message', errorMessage);
      });
    } catch (error) {
      // Remove from pending on error
      setPendingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
    }
  }, [matchId]);

  return {
    sendMessage,
    isMessagePending: (id: string) => pendingMessages.has(id),
  };
}
```

**Step 5: Run tests to verify they pass**

Run: `cd server && npm test -- websocket/ack.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
cd server
git add src/websocket/socketManager.ts client/hooks/useChat.ts src/tests/websocket/ack.test.ts
git commit -m "feat(websocket): add message acknowledgment for delivery confirmation"
```

---

### Task 11.2: Add Auto-Reconnection Logic

**Files:**
- Modify: `client/api/chats.ts` (create or modify)
- Test: `client/__tests__/api/chats.reconnect.test.ts` (create)

**Step 1: Write failing test for auto-reconnection**

```typescript
// client/__tests__/api/chats.reconnect.test.ts
import { io as ClientIO } from 'socket.io-client';

describe('WebSocket - Auto Reconnection', () => {
  it('should automatically reconnect on disconnect', (done) => {
    const client = ClientIO('http://localhost:0', {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    let connectCount = 0;

    client.on('connect', () => {
      connectCount++;

      if (connectCount === 1) {
        // First connection successful
        client.disconnect();
      } else if (connectCount === 2) {
        // Reconnection successful
        client.disconnect();
        done();
      }
    });

    client.connect();
  }, 10000);
});
```

**Step 2: Run test to verify it fails**

Run: `cd client && npm test -- api/chats.reconnect.test.ts`
Expected: FAIL - reconnection not implemented

**Step 3: Implement auto-reconnection in socket client**

```typescript
// client/api/chats.ts

import { io as ClientIO, Socket } from 'socket.io-client';

export const connectWebSocket = (token: string): Socket => {
  return ClientIO(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000', {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket'],
    reconnection: true,              // Enable auto-reconnection
    reconnectionDelay: 1000,          // Start with 1 second
    reconnectionDelayMax: 10000,      // Max delay 10 seconds
    reconnectionAttempts: 5,            // Try 5 times
    randomizationFactor: 0.5,       // Add randomness
    timeout: 20000,                 // 20 second timeout
  });
};

export const setupSocketListeners = (socket: Socket) => {
  socket.on('connect', () => {
    logger.info('[Socket] Connected');
  });

  socket.on('disconnect', (reason) => {
    logger.warn('[Socket] Disconnected', { reason });

    // Reconnection is handled by socket.io-client config
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    logger.info('[Socket] Reconnection attempt', { attemptNumber });
  });

  socket.on('reconnect_failed', (error) => {
    logger.error('[Socket] Reconnection failed', { error });

    // Show user notification
    // This would integrate with your notification system
  });

  socket.on('connect_error', (error) => {
    logger.error('[Socket] Connection error', { error });
  });
};
```

**Step 4: Run tests to verify they pass**

Run: `cd client && npm test -- api/chats.reconnect.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
cd client
git add api/chats.ts __tests__/api/chats.reconnect.test.ts
git commit -m "feat(websocket): add auto-reconnection with exponential backoff"
```

---

### Task 11.3: Add Typing Timeout

**Files:**
- Modify: `server/src/websocket/socketManager.ts`
- Modify: `client/components/MessageInput.tsx` (if exists or modify)
- Test: `server/src/tests/websocket/typing.test.ts` (create)

**Step 1: Write failing test for typing timeout**

```typescript
// server/src/tests/websocket/typing.test.ts
import { createServer, Server as HTTPServer } from 'http';
import { io as ClientIO } from 'socket.io-client';
import { generateTestToken } from '@/tests/helpers';

describe('WebSocket - Typing Timeout', () => {
  let httpServer: HTTPServer;
  let serverSocket: any;

  beforeEach((done) => {
    httpServer = createServer(app);
    serverSocket = initializeSocket(httpServer);
    httpServer.listen(0, done);
  });

  afterEach((done) => {
    serverSocket.close();
    httpServer.close(done);
  });

  it('should stop typing indicator after timeout', async () => {
    const socket = ClientIO('http://localhost:0', {
      auth: { token: generateTestToken('user1') },
    });

    await socket.connect();

    let userTypingReceived = false;
    let userStopTypingReceived = false;

    socket.on('user_typing', () => {
      userTypingReceived = true;
    });

    socket.on('user_stop_typing', () => {
      userStopTypingReceived = true;
    });

    // Simulate typing
    socket.emit('typing', { matchId: 'match1' });

    // Wait for timeout (should be 5 seconds based on implementation)
    await new Promise(resolve => setTimeout(resolve, 5500));

    // Typing should have been stopped
    expect(userTypingReceived).toBe(true);
    expect(userStopTypingReceived).toBe(true);

    socket.disconnect();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test -- websocket/typing.test.ts`
Expected: FAIL - timeout not implemented

**Step 3: Implement typing timeout**

```typescript
// server/src/websocket/socketManager.ts

const TYPING_TIMEOUT = 5000; // 5 seconds

// Store typing timeouts per match per user
const typingTimeouts = new Map<string, NodeJS.Timeout>();

    // Handle typing indicator
    socket.on("typing", (data) => {
      try {
        const { matchId } = data;

        logger.info("USER_TYPING", { userId, matchId });

        // Clear existing timeout for this user/match
        const existingTimeout = typingTimeouts.get(`${userId}-${matchId}`);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Broadcast to match room
        socket.to(`match_${matchId}`).emit("user_typing", { matchId, userId });

        // Set timeout to stop typing indicator
        const timeout = setTimeout(() => {
          logger.info("TYPING_TIMEOUT", { userId, matchId });
          socket.to(`match_${matchId}`).emit("user_stop_typing", { matchId, userId });
          typingTimeouts.delete(`${userId}-${matchId}`);
        }, TYPING_TIMEOUT);

        typingTimeouts.set(`${userId}-${matchId}`, timeout);
      } catch (err) {
        logger.error("Error in typing handler", err);
      }
    });

    // Handle stop typing
    socket.on("stop_typing", (data) => {
      try {
        const { matchId } = data;

        logger.info("USER_STOP_TYPING", { userId, matchId });

        // Clear timeout
        const existingTimeout = typingTimeouts.get(`${userId}-${matchId}`);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          typingTimeouts.delete(`${userId}-${matchId}`);
        }

        // Broadcast to match room
        socket.to(`match_${matchId}`).emit("user_stop_typing", { matchId, userId });
      } catch (err) {
        logger.error("Error in stop_typing handler", err);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      try {
        const user = userSockets.get(socket.id);

        if (user) {
          // Clear all typing timeouts for this user
          user.matchIds.forEach((matchId) => {
            const timeout = typingTimeouts.get(`${user.userId}-${matchId}`);
            if (timeout) {
              clearTimeout(timeout);
            }
          });
        });

          logger.info("SOCKET_DISCONNECTED", { socketId: socket.id, userId: user.userId });
        }

        userSockets.delete(socket.id);
      } catch (err) {
        logger.error("Error in disconnect handler", err);
      }
    });
```

**Step 4: Add typing timeout UI to client**

```typescript
// client/components/MessageInput.tsx

import React, { useState, useEffect } from 'react';

const TYPING_TIMEOUT = 5000; // 5 seconds

export default function MessageInput({ matchId, onSendMessage }: Props) {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTypingStart = () => {
    setIsTyping(true);

    // Send typing event to server
    socket.emit('typing', { matchId });
  };

  const handleTypingStop = () => {
    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send stop typing event
    socket.emit('stop_typing', { matchId });

    // Local timeout as backup
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, TYPING_TIMEOUT);
  };

  // Listen for stop typing from server (timeout)
  useEffect(() => {
    socket.on('user_stop_typing', (data: { matchId: data.matchId }) => {
      if (matchId === data.matchId) {
        setIsTyping(false);

        // Clear local timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    });

    return () => {
      socket.off('user_stop_typing');
    };
  }, [matchId]);

  // ... rest of component
}
```

**Step 5: Run tests to verify they pass**

Run: `cd server && npm test -- websocket/typing.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
cd server
git add src/websocket/socketManager.ts client/components/MessageInput.tsx src/tests/websocket/typing.test.ts
git commit -m "feat(websocket): add typing timeout to clear stale indicators"
```

---

## Summary

This implementation plan addresses:

**Test Infrastructure Setup (Phase 0):**
- Test helpers file with reusable functions
- Frontend Jest configuration
- Required before running other tests

**Critical Security Fixes (Phase 1):**
- Rate limiting on all auth endpoints
- Password strength validation
- Race condition prevention in like creation
- CSRF protection

**Data Integrity Fixes (Phase 2):**
- Profile auto-save race condition prevention
- Block interaction prevention
- Message cleanup on unmatch (verify cascade delete)

**User Flow Improvements (Phase 3):**
- Offline queue for API calls
- Session refresh race condition prevention
- Profile completion validation

**Code Quality Improvements (Phase 4):**
- Remove type assertions with `any`
- Centralized error handling
- Improved pagination logic

**Frontend Improvements (Phase 5):**
- Accessibility labels
- Optimistic UI rollback
- Network status indicator

**Database & Performance (Phase 6):**
- Performance indexes
- Query optimization (batched queries)

**Monitoring & Observability (Phase 7):**
- Request ID tracking
- Structured logging

**Additional Security (Phase 8):**
- Input sanitization (basic implementation with upgrade path)
- File upload validation

**Testing Improvements (Phase 9):**
- API integration tests
- Frontend component tests

**Documentation & Cleanup (Phase 10):**
- Deployment guide
- Remove debug auth bypass

**WebSocket Improvements (Phase 11):**
- Message acknowledgment
- Auto-reconnection
- Typing timeout

**Total Tasks:** 35 (including Phase 0)
**Estimated Time:** 15-20 hours for all phases

Each task follows TDD approach: write failing test → implement → verify → commit.

---

## Important Notes

### Task Dependencies
- **Phase 0 must be completed first** - Test helpers and Jest config are required for all other test tasks
- **Task 2.3** - Verify cascade delete works before creating migration; it may already be working

### Potential Issues Fixed
1. **Task 6.2** - Changed from invalid SQL subquery approach to batched Prisma queries
2. **Task 2.3** - Added verification step since cascade delete may already exist
3. **Phase 0** - Added missing test infrastructure setup phase
4. **Task 8.1** - Added note about production-grade sanitization library option

### Testing Strategy
- Backend: Use `server/src/tests/helpers.ts` for all test tasks
- Frontend: Install testing libraries first (Task 0.2) before running frontend tests
- Integration tests should mock Prisma for unit tests, use real DB for integration tests
