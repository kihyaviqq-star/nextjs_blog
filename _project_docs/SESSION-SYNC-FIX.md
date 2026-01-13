# 🔄 Session Synchronization Fix

## Problem
When updating user profile (Name/Avatar) in `/settings`, the Header component did not update immediately. Changes were visible only after re-login due to stale JWT token data.

## Root Cause
NextAuth v5 uses JWT tokens by default. Session data is cached in the token, and updates to the database don't automatically refresh the token.

## Solution

### 1. **Fresh Data in Session Callback** (`lib/auth.config.ts`)

Modified `callbacks.session` to fetch fresh user data from the database on every session call:

```typescript
async session({ session, token }) {
  if (token && session.user) {
    // Всегда получаем свежие данные из БД для актуальности
    const freshUser = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    if (freshUser) {
      session.user.id = freshUser.id;
      session.user.name = freshUser.name;
      session.user.email = freshUser.email;
      (session.user as any).role = freshUser.role;
      (session.user as any).avatarUrl = freshUser.avatarUrl;
    }
  }
  return session;
}
```

**Benefits:**
- ✅ Every `await auth()` call returns fresh data from DB
- ✅ No stale data in UI components
- ✅ Works without manual session updates

### 2. **Cache Invalidation** (`app/api/profile/route.ts`)

Added `revalidatePath` to clear Next.js cache after profile update:

```typescript
import { revalidatePath } from "next/cache";

// After updating profile in DB
revalidatePath('/');
revalidatePath('/settings');
revalidatePath('/admin');
```

**Benefits:**
- ✅ Forces Next.js to re-fetch server components
- ✅ Updates all pages that depend on user data

### 3. **Client-Side Refresh** (`app/settings/page.tsx`)

Added `router.refresh()` after successful profile update:

```typescript
if (response.ok) {
  // Обновляем сессию NextAuth для немедленного обновления UI
  await update();
  
  // Обновляем серверные компоненты (Header и т.д.)
  router.refresh();
  
  alert("Профиль успешно обновлен!");
}
```

**Benefits:**
- ✅ Triggers session refresh via `update()`
- ✅ Forces router to re-fetch server components via `refresh()`
- ✅ Immediate UI update without page reload

### 4. **Avatar Display** (`components/user-menu.tsx`)

Updated UserMenu to display real user avatar from session:

```typescript
const avatarUrl = (session.user as any).avatarUrl;

{avatarUrl ? (
  <img 
    src={avatarUrl} 
    alt={session.user.name || "User"} 
    className="w-8 h-8 rounded-full object-cover"
  />
) : (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
    <User className="w-4 h-4 text-white" />
  </div>
)}
```

## How It Works Now

### User Flow:
1. User opens `/settings`
2. Changes name from "Сара Чен" to "Ivan"
3. Uploads new avatar URL
4. Clicks "Save"

### What Happens:
1. ✅ `PUT /api/profile` updates database
2. ✅ `revalidatePath()` clears Next.js cache
3. ✅ `update()` triggers NextAuth session refresh
4. ✅ `router.refresh()` re-fetches server components
5. ✅ `callbacks.session` fetches fresh data from DB
6. ✅ Header immediately shows "Ivan" + new avatar
7. ✅ No page reload needed!

## Performance Considerations

### Database Queries
- **Concern**: Extra DB query on every `await auth()` call
- **Impact**: Minimal - query is simple (`findUnique` with indexed `id`)
- **Optimization**: Consider Redis caching if needed at scale

### Alternative Approaches
If performance becomes an issue, you can:

1. **Use database sessions instead of JWT**
   ```typescript
   // auth.config.ts
   session: { strategy: "database" }
   ```

2. **Cache with shorter TTL**
   ```typescript
   // Use Redis with 30-second TTL
   const cachedUser = await redis.get(`user:${userId}`);
   ```

3. **Selective refresh**
   Only fetch fresh data when profile was recently updated (use timestamp)

## Testing

### Manual Test:
1. Login as admin: `editor@ai-stat.ru` / `editor123`
2. Open `/settings`
3. Change name to "Test User"
4. Click Save
5. Check Header - should show "Test User" immediately
6. Change avatar URL
7. Click Save
8. Check Header - should show new avatar immediately

### Expected Results:
- ✅ Name updates in Header without reload
- ✅ Avatar updates in UserMenu dropdown
- ✅ Role label updates if changed
- ✅ Changes persist after page reload
- ✅ Changes visible in all tabs immediately

## Files Modified

1. `lib/auth.config.ts` - Fresh data in session callback
2. `app/api/profile/route.ts` - Cache invalidation
3. `app/settings/page.tsx` - Client-side refresh
4. `components/user-menu.tsx` - Avatar display

## Related Documentation

- NextAuth v5 Docs: https://authjs.dev/
- Next.js Caching: https://nextjs.org/docs/app/building-your-application/caching
- Prisma Best Practices: https://www.prisma.io/docs/guides/performance-and-optimization

## Notes

- This solution works with both JWT and database session strategies
- For high-traffic apps, consider implementing Redis caching layer
- Session callback runs on every `await auth()` - keep queries optimized
