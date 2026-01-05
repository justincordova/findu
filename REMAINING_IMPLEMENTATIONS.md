# Remaining Implementations Guide

**Status:** 12 completed, 52 remaining
**Completed commits:** 12 total
**This document:** Implementation guide for remaining HIGH and MEDIUM priority items

---

## Quick Reference: Remaining Work

### HIGH Priority (18 items)
- [ ] Implement token refresh mechanism
- [ ] Add token validation on protected screens
- [ ] Prevent duplicate swipes race condition
- [ ] Fix MatchesStore polling interval leak
- [ ] Implement Chat messaging functionality
- [ ] Add profile data auto-save during onboarding
- [ ] Fix session restoration race condition
- [ ] Implement consistent API error handling (API clients)
- [ ] Add type guards for API responses
- [ ] Add retry logic to API clients
- [ ] Add request timeouts to API
- [ ] Fix ENABLE_AUTH security check
- [ ] Add transaction to profile updates
- [ ] Implement Redis cache invalidation

### MEDIUM Priority (31 items)
See full list below with implementation details

---

## Implementation Details by Category

### 1. FRONTEND: Token Management (HIGH)

#### Token Refresh Mechanism
**Files to modify:** `client/services/authService.ts`, `client/api/utils.ts`

```typescript
// In authService.ts - Add refresh handler
async function refreshToken(): Promise<boolean> {
  const token = await getSecureItem(ACCESS_TOKEN_KEY);
  if (!token) return false;

  try {
    const res = await AuthAPI.refreshSession(token);
    if (res?.token) {
      await saveSecureItem(ACCESS_TOKEN_KEY, res.token);
      const { setToken } = useAuthStore.getState();
      setToken(res.token);
      return true;
    }
  } catch (err) {
    logger.error("Token refresh failed", { err });
  }
  return false;
}

// In API client - Add interceptor for 401
// After receiving 401, try refresh, then retry request
```

#### Token Validation on Protected Screens
**Files to modify:** `client/app/home/_layout.tsx`, `client/app/profile-setup/[step].tsx`

```typescript
// Add to home layout
useFocusEffect(
  useCallback(() => {
    const { isLoggedIn, token } = useAuthStore.getState();
    if (!isLoggedIn || !token) {
      router.replace("/");
    }
  }, [])
);
```

---

### 2. FRONTEND: Race Conditions & State (HIGH)

#### Prevent Duplicate Swipes
**File:** `client/app/home/(tabs)/discover.tsx`

```typescript
// Add in component state
const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);

const handleSwipeRight = useCallback(async () => {
  if (isProcessingSwipe) return; // Prevent concurrent swipes
  setIsProcessingSwipe(true);
  try {
    // Send like
  } finally {
    setIsProcessingSwipe(false);
  }
}, [isProcessingSwipe]);
```

#### Fix MatchesStore Polling Leak
**File:** `client/store/matchesStore.ts`

```typescript
// Ensure polling is stopped on unmount
// Use AbortController to cancel pending requests
```

#### Fix Session Restoration Race
**File:** `client/app/_layout.tsx`

```typescript
// Already fixed by separating loading check from effects
// Current implementation is correct - loading shows while both fonts and session load
```

---

### 3. FRONTEND: UI Features (HIGH)

#### Implement Chat Messaging
**New files needed:**
- `client/app/home/(tabs)/messages.tsx` - Main chat screen (not stub)
- `client/components/messages/MessageList.tsx`
- `client/components/messages/MessageInput.tsx`
- `client/api/messages.ts` - API client
- `client/store/messagesStore.ts` - Chat state
- `client/services/messagesService.ts`

**Implementation approach:**
1. Create message API client with list, send, delete endpoints
2. Implement WebSocket for real-time or polling fallback
3. Create message store with pagination
4. Build message UI components
5. Add navigation from matches screen

#### Add Profile Auto-Save During Onboarding
**File:** `client/app/profile-setup/[step].tsx`

```typescript
// Add useEffect to save after each step
useEffect(() => {
  const saveTimeout = setTimeout(async () => {
    if (hasDataChanged) {
      await profileApi.updateProfile(userId, currentStepData);
      setSaved(true);
    }
  }, 1000); // Debounce saves

  return () => clearTimeout(saveTimeout);
}, [profileData]);
```

---

### 4. FRONTEND: API Error Handling (HIGH)

**File:** All API clients in `client/api/*.ts`

Replace current error handling with new utility:

```typescript
// Current (in each file)
const data = await res.json().catch(() => ({}));
if (!res.ok) throw data;

// New (use shared utility)
import { handleResponse, APIError, isRetryableError } from "./utils";

const data = await handleResponse<ProfileData>(res, "profile fetch");
```

**Steps:**
1. Update `client/api/auth.ts`
2. Update `client/api/profile.ts`
3. Update `client/api/discover.ts`
4. Update `client/api/likes.ts`
5. Update `client/api/matches.ts`
6. Update `client/api/blocks.ts`
7. Update `client/api/storage.ts`
8. Update `client/api/constants.ts`

---

### 5. FRONTEND: Retry & Timeout Logic (HIGH)

**File:** `client/api/utils.ts` - Add retry utility

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRetryableError(err) || i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastError;
}

// Usage in API clients
const data = await withRetry(() =>
  fetch(...).then(r => handleResponse(r))
);
```

**Add timeouts:**

```typescript
function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 30000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), ms)
    )
  ]);
}
```

---

### 6. FRONTEND: Type Guards (HIGH)

**File:** `client/api/utils.ts` - Add validators

```typescript
export function validateProfileResponse(data: any): data is Profile {
  return (
    typeof data?.user_id === 'string' &&
    typeof data?.name === 'string' &&
    Array.isArray(data?.photos)
  );
}

export function validateMatchResponse(data: any): data is Match {
  return (
    typeof data?.id === 'string' &&
    typeof data?.user1 === 'string' &&
    typeof data?.user2 === 'string'
  );
}

// Usage
const data = await handleResponse<any>(res);
if (!validateProfileResponse(data)) {
  throw new Error("Invalid profile response");
}
```

---

### 7. BACKEND: Security & Integrity (HIGH)

#### Fix ENABLE_AUTH Security Check
**File:** `server/src/middleware/auth/requireAuth.ts`

```typescript
// Current (VULNERABLE)
if (process.env.ENABLE_AUTH === 'false') { // Can be accidentally set to 'false'

// Fixed
const enableAuth = process.env.NODE_ENV === 'production' ||
                   process.env.ENABLE_AUTH !== 'false';
// Or better: require explicit ENABLE_AUTH=true in dev
const enableAuth = process.env.NODE_ENV === 'production' ||
                   process.env.ENABLE_AUTH === 'true';
```

#### Add Transaction to Profile Updates
**File:** `server/src/modules/profiles/services.ts`

```typescript
export const updateProfile = async (userId: string, data: Partial<Profile>) => {
  return prisma.$transaction(async (tx) => {
    const profile = await tx.profiles.findUnique({ where: { user_id: userId } });
    if (!profile) return null;

    return tx.profiles.update({
      where: { user_id: userId },
      data: sanitizeProfileData(data)
    });
  });
};
```

---

### 8. BACKEND: Caching & Optimization (MEDIUM)

#### Implement Redis Cache Invalidation
**File:** `server/src/modules/discover/services.ts`

```typescript
// On like creation, invalidate caches
async function createLike(data: LikeData) {
  const like = await prisma.likes.create({ data });

  // Invalidate discover cache for both users
  await redis.del(`discover:${data.from_user}:*`);
  await redis.del(`discover:${data.to_user}:*`);

  return like;
}

// On match creation, invalidate for both users
async function createMatch(user1: string, user2: string) {
  const match = await prisma.matches.create({ data: { user1, user2 } });

  await redis.del(`discover:${user1}:*`);
  await redis.del(`discover:${user2}:*`);

  return match;
}
```

#### Implement Discover Feed Caching
**File:** `server/src/modules/discover/services.ts`

```typescript
// Cache discover results with TTL
async function getDiscoverFeed(userId: string, limit: number, offset: number) {
  const cacheKey = `discover:${userId}:${limit}:${offset}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const profiles = await getEligibleCandidates(...);

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify({ profiles, total: profiles.length }));

  return { profiles, total: profiles.length };
}
```

---

### 9. BACKEND: Code Organization (MEDIUM)

#### Split Discover Service (3 modules)
**Create three new files:**

1. **`server/src/modules/discover/algorithm.ts`** - Pure functions
   ```typescript
   export function calculateCompatibilityScore(user1: Profile, user2: Profile): number
   export function filterByAge(profiles: Profile[], minAge: number, maxAge: number)
   export function filterByGender(profiles: Profile[], preferences: string[])
   ```

2. **`server/src/modules/discover/filters.ts`** - Database queries
   ```typescript
   export async function getEligibleCandidates(userId: string, filters: DiscoverFilter)
   export async function getBlockedUsers(userId: string)
   export async function getMutualLikes(userId: string)
   ```

3. **`server/src/modules/discover/services.ts`** - Orchestration (refactored)
   ```typescript
   export async function getDiscoverFeed(userId: string, limit: number, offset: number) {
     // Use functions from algorithm.ts and filters.ts
   }
   ```

---

### 10. FRONTEND: Accessibility (MEDIUM)

#### Fix WCAG Disabled State
**File:** `client/components/shared/Button.tsx` or wherever disabled styles defined

```typescript
// BEFORE (WCAG violation)
disabledWrapper: {
  opacity: 0.5,
}

// AFTER (WCAG compliant)
disabledWrapper: {
  backgroundColor: MUTED_COLOR, // Use contrasting color
  opacity: 1, // Full opacity
}
```

#### Add 44x44 Touch Targets
Audit all interactive elements and ensure minimum size:

```typescript
// Ensure all buttons have
minWidth: 44,
minHeight: 44,
// Or padding that achieves this total size
padding: 12, // With border, totals 44x44
```

#### Add Accessibility Labels
Add to interactive elements:

```typescript
<Pressable
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Swipe right to like this profile"
  onPress={handleLike}
>
```

---

### 11. TESTING (MEDIUM)

Create comprehensive test files in `server/src/tests/modules/`:

```typescript
// blocks.service.test.ts
describe('Block cascades', () => {
  it('should delete likes when users are blocked', async () => {
    // Test on_block_cleanup trigger
  });

  it('should delete matches when users are blocked', async () => {
    // Test on_block_cleanup trigger
  });
});

// discover.service.test.ts
describe('Discover with pagination', () => {
  it('should paginate correctly with large datasets', async () => {
    // Test with 500+ profiles
  });
});

// auth.service.test.ts
describe('Token refresh', () => {
  it('should refresh expired tokens', async () => {
    // Test token refresh flow
  });
});
```

---

## Implementation Order (Recommended)

1. **Error utilities** ✅ DONE
2. API error handling (frontend) - 1 commit
3. Token refresh + timeout/retry - 1 commit
4. Token validation on protected screens - 1 commit
5. Prevent duplicate swipes - 1 commit
6. Fix ENABLE_AUTH - 1 commit
7. Profile transaction updates - 1 commit
8. Cache invalidation - 1 commit
9. Discover caching - 1 commit
10. WCAG accessibility fixes - 1 commit
11. Chat implementation - 2-3 commits
12. Profile auto-save - 1 commit
13. Discover service split - 1 commit
14. Testing - 2-3 commits

**Total estimated commits:** 18-20 more

---

## Quick Command Reference

```bash
# Run backend linting
cd server && npm run lint

# Run frontend linting (when config fixed)
cd client && npm run lint

# Run tests
cd server && npm test

# View commit log
git log --oneline -20
```

---

## Notes

- All commits should NOT include "Generated by Claude" or "coathured by claude"
- Each commit should be focused and logical
- Run linting before each commit
- Use conventional commit format: `feat(scope): description` or `fix(scope): description`
- Keep commit messages clear and concise

---

**Last Updated:** January 5, 2026
**Remaining High Priority:** 17 items
**Remaining Medium Priority:** 31 items
**Total Remaining:** 48 items
