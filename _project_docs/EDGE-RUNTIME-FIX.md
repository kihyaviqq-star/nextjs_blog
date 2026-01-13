# 🔧 Edge Runtime Fix - Prisma in Middleware

## Problem

**Error:**
```
JWTSessionError: PrismaClient is not configured to run in Edge Runtime
```

**Cause:**
- NextAuth middleware runs in Edge Runtime
- Session callback was calling Prisma directly
- Prisma cannot run in Edge Runtime without special configuration

## Solution

### Changed Strategy

**Before (❌ Broken):**
```typescript
async session({ session, token }) {
  // This runs on EVERY request in Edge Runtime
  const freshUser = await prisma.user.findUnique({
    where: { id: token.id }
  });
  // Error: Prisma doesn't work in Edge!
}
```

**After (✅ Fixed):**
```typescript
async jwt({ token, user, trigger, session }) {
  // On login: save user data to token
  if (user) {
    token.id = user.id;
    token.name = user.name;
    token.role = user.role;
    token.avatarUrl = user.avatarUrl;
  }
  
  // On update(): fetch fresh data from DB
  if (trigger === "update") {
    const freshUser = await prisma.user.findUnique({
      where: { id: token.id }
    });
    // Update token with fresh data
    token.name = freshUser.name;
    token.avatarUrl = freshUser.avatarUrl;
  }
  
  return token;
}

async session({ session, token }) {
  // Just copy data from token (no DB call!)
  session.user = token;
  return session;
}
```

### Key Changes

1. **JWT callback** handles Prisma queries (runs in Node.js runtime)
2. **Session callback** just copies data from token (runs in Edge runtime)
3. **Update trigger** refreshes data when `update()` is called

## How It Works Now

### Normal Request Flow:
```
User makes request
    ↓
Middleware runs (Edge Runtime)
    ↓
Session callback (no DB call)
    ↓
Returns cached data from JWT token
    ↓
✅ Fast & works in Edge!
```

### Profile Update Flow:
```
User saves profile in /settings
    ↓
API updates database
    ↓
await update() called
    ↓
JWT callback triggered with trigger="update"
    ↓
Fetches fresh data from DB (Node.js runtime)
    ↓
Updates JWT token
    ↓
Session callback returns fresh data
    ↓
✅ UI updates immediately!
```

## Benefits

- ✅ Works in Edge Runtime (middleware)
- ✅ Fast (no DB query on every request)
- ✅ Fresh data when needed (via `update()`)
- ✅ Secure (JWT signed by NextAuth)

## Testing

1. **Login works:**
   - Go to `/auth/signin`
   - Enter: `editor@ai-stat.ru` / `editor123`
   - Should redirect to home immediately

2. **Profile updates work:**
   - Go to `/settings`
   - Change name to "Test User"
   - Click Save
   - Header should update immediately

3. **Middleware works:**
   - Try accessing `/admin/create` without login
   - Should redirect to `/auth/signin`

## Files Modified

- `lib/auth.config.ts` - Moved Prisma query to JWT callback

## Related Issues

- NextAuth v5 Edge Runtime: https://authjs.dev/getting-started/migrating-to-v5
- Prisma Edge Functions: https://www.prisma.io/docs/orm/prisma-client/deployment/edge/overview

## Alternative Solutions

If you need fresh data on EVERY request, you have two options:

### 1. Database Sessions
```typescript
// auth.config.ts
export default {
  session: { strategy: "database" }
}
```
**Pros:** Always fresh data
**Cons:** DB query on every request, slower

### 2. Prisma Accelerate
```typescript
// Use Prisma Accelerate for Edge Runtime
import { PrismaClient } from '@prisma/client/edge'
```
**Pros:** Works in Edge
**Cons:** Requires paid Prisma Accelerate

## Current Solution

JWT strategy with manual refresh via `update()` is the best balance:
- ✅ Fast (no DB on every request)
- ✅ Works in Edge Runtime
- ✅ Updates when needed
- ✅ Free (no extra services)
