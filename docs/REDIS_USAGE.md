# Redis Usage Summary

## Overview

Redis is being used appropriately for three main purposes in the authentication system:

## 1. OTP Storage ✅

**Location**: `server/src/modules/auth/services.ts`

- **Purpose**: Store OTP codes temporarily with expiration
- **Key Pattern**: `otp:{email}`
- **TTL**: 600 seconds (10 minutes) by default, configurable via `OTP_EXPIRATION_SECONDS`
- **Implementation**: Direct Redis commands (`SET`, `GET`, `DEL`) with expiration
- **Fallback**: In-memory Map if Redis is unavailable (handled gracefully)

**Usage**:

```typescript
// Store OTP
await redis.set(`otp:${email}`, otp, "EX", OTP_EXPIRATION);

// Verify OTP
const storedOtp = await redis.get(`otp:${email}`);

// Delete OTP after use
await redis.del(`otp:${email}`);
```

## 2. Rate Limiting for OTP Requests ✅

**Location**: `server/src/middleware/auth/rateLimitOTP.ts`

- **Purpose**: Prevent abuse by limiting OTP requests per email address
- **Key Pattern**: `otp_rate_limit:{email}`
- **Limit**: 3 requests per minute per email
- **Window**: 60 seconds
- **Implementation**: Redis INCR with expiration

**Usage**:

```typescript
// Check and increment rate limit counter
const attempts = await redis.get(rateLimitKey);
await redis.incr(rateLimitKey);
await redis.expire(rateLimitKey, OTP_RATE_LIMIT_WINDOW);
```

## 3. Better Auth Secondary Storage ✅

**Location**: `server/src/lib/auth.ts`

- **Purpose**: Cache session data for improved performance
- **Key Pattern**: Managed by Better Auth (internal)
- **Implementation**: Better Auth's `secondaryStorage` interface
- **Benefits**:
  - Faster session lookups
  - Reduced database load
  - Automatic TTL management

**Configuration**:

```typescript
secondaryStorage: {
  get: async (key: string) => await redis.get(key),
  set: async (key: string, value: string, ttl?: number) => {
    if (ttl) await redis.setex(key, ttl, value);
    else await redis.set(key, value);
  },
  delete: async (key: string) => await redis.del(key),
}
```

## Redis Connection Management

**Location**: `server/src/lib/redis.ts`

- **Connection**: Single Redis client instance (singleton pattern)
- **Error Handling**: Graceful fallback to in-memory storage
- **Lifecycle**: Proper cleanup on SIGINT/SIGTERM
- **Health Check**: `isRedisReady()` function for connection status

## Best Practices Implemented

1. ✅ **TTL on all keys**: All Redis keys have expiration times
2. ✅ **Graceful degradation**: Falls back to in-memory storage if Redis unavailable
3. ✅ **Error handling**: All Redis operations wrapped in try-catch
4. ✅ **Key naming**: Consistent key patterns with prefixes (`otp:`, `otp_rate_limit:`)
5. ✅ **Connection pooling**: Single client instance reused across the application
6. ✅ **Security**: Redis password support via environment variables

## Environment Variables

```bash
REDIS_HOST=localhost          # Redis host
REDIS_PORT=6379              # Redis port
REDIS_PASSWORD=              # Redis password (optional)
REDIS_DB=0                   # Redis database number
```

## Monitoring Recommendations

1. Monitor Redis memory usage
2. Track OTP request rates
3. Monitor connection status
4. Check for keys without TTL (should be none)
5. Monitor error rates in fallback scenarios

## Summary

Redis is being used appropriately for:

- ✅ Temporary OTP storage with expiration
- ✅ Rate limiting to prevent abuse
- ✅ Session caching for Better Auth

All implementations follow best practices with proper error handling, TTL management, and graceful degradation.
