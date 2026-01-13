# 🔄 Username Migration Guide

## Summary

Complete migration to root-level usernames with database schema updates and backfill script.

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
Added `username` field to User model:
```prisma
model User {
  id       String  @id @default(cuid())
  name     String?
  username String? @unique // NEW: URL-friendly username
  email    String  @unique
  // ...
}
```

### 2. Type Definitions (`types/next-auth.d.ts`)
Created TypeScript types for NextAuth with username:
```typescript
interface Session {
  user: {
    id: string;
    username?: string;
    role?: string;
    avatarUrl?: string;
  } & DefaultSession["user"];
}
```

### 3. Auth Configuration (`lib/auth.config.ts`)
Updated to include username in JWT and session:
- Added username to JWT token
- Added username to session
- Added username to authorize callback

### 4. User Menu (`components/user-menu.tsx`)
Updated "My Profile" link to use username:
```typescript
const profileLink = username 
  ? `/${username}` 
  : `/settings`; // Fallback
```

### 5. Profile API (`app/api/profile/route.ts`)
Updated to handle username:
- GET returns username
- PUT validates and updates username
- Checks uniqueness and reserved names

### 6. Profile Page (`app/[username]/page.tsx`)
Updated to search by username field:
```typescript
const user = await prisma.user.findFirst({
  where: {
    username: { equals: username, mode: 'insensitive' }
  }
});
```

### 7. Backfill Script (`prisma/fix-usernames.ts`)
Created script to generate usernames for existing users.

## Migration Steps

### Step 1: Apply Database Migration

```bash
# Push schema changes to database
npx prisma db push

# Or if using migrations:
npx prisma migrate dev --name add_username_field
```

**What this does:**
- Adds `username` column to User table
- Makes it unique and nullable
- No data loss

### Step 2: Run Backfill Script

```bash
# Generate usernames for existing users
npx tsx prisma/fix-usernames.ts
```

**What this does:**
- Finds all users without username
- Generates usernames from name or email
- Ensures uniqueness (adds numbers if needed)
- Updates database

**Example output:**
```
🔍 Searching for users without usernames...

Found 2 user(s) without username:

Processing: Сара Чен
  → Generated from name: sara-chen
  ✅ Updated to: sara-chen

Processing: Иван Петров
  → Generated from name: ivan-petrov
  ✅ Updated to: ivan-petrov

✅ Successfully updated 2 user(s)!
```

### Step 3: Verify Changes

```bash
# Open Prisma Studio to check
npx prisma studio
```

**Check:**
- ✅ All users have username field
- ✅ All usernames are unique
- ✅ No reserved usernames

### Step 4: Restart Application

```bash
# Restart dev server
# Ctrl+C to stop
npm run dev
```

**Why:** TypeScript types and Prisma client need to regenerate.

### Step 5: Test Profile Links

**Test 1: Existing user**
```
1. Login: editor@ai-stat.ru / editor123
2. Click user menu → "Мой профиль"
3. Should navigate to: /sara-chen (or generated username)
```

**Test 2: Profile page**
```
1. Visit: http://localhost:3000/sara-chen
2. Should show user profile
3. Check: Avatar, bio, social links
```

**Test 3: Username change**
```
1. Go to: /settings
2. Change username to: "nikita"
3. Save profile
4. Should navigate to: /nikita
```

## Username Generation Logic

### Priority 1: From Name
```typescript
"Сара Чен" → "sara-chen"
"John Doe" → "john-doe"
"Admin User" → "admin-user"
```

**Transliteration (Cyrillic → Latin):**
```typescript
а→a, б→b, в→v, г→g, д→d, е→e, ё→yo,
ж→zh, з→z, и→i, й→y, к→k, л→l, м→m,
н→n, о→o, п→p, р→r, с→s, т→t, у→u,
ф→f, х→h, ц→ts, ч→ch, ш→sh, щ→sch,
ъ→'', ы→y, ь→'', э→e, ю→yu, я→ya
```

### Priority 2: From Email
```typescript
"editor@ai-stat.ru" → "editor"
"user@example.com" → "user"
"admin123@test.com" → "admin123"
```

### Uniqueness Handling
```typescript
"john"     → "john"      // First user
"john"     → "john1"     // Second user
"john"     → "john2"     // Third user
```

## Edge Cases

### Case 1: Reserved Username
```typescript
// User tries to set username to "admin"
Error: "Этот никнейм зарезервирован системой"
```

### Case 2: Already Taken
```typescript
// User tries to take existing username
Error: "Это имя пользователя уже занято"
```

### Case 3: Invalid Format
```typescript
// User tries "ab" (too short)
Error: "Имя пользователя должно содержать минимум 3 символа"

// User tries "user@123" (special chars)
Error: "Имя пользователя может содержать только буквы, цифры, дефис и подчеркивание"
```

### Case 4: No Username Yet
```typescript
// Old user without username
// Fallback to settings page
profileLink = "/settings"
```

## Rollback (if needed)

### Remove username column:
```sql
-- SQLite
ALTER TABLE User DROP COLUMN username;

-- Note: SQLite doesn't support DROP COLUMN directly
-- You need to recreate the table without username
```

### Revert code changes:
```bash
git checkout HEAD -- lib/auth.config.ts
git checkout HEAD -- components/user-menu.tsx
git checkout HEAD -- app/api/profile/route.ts
git checkout HEAD -- app/[username]/page.tsx
```

## Future Improvements

### 1. Make Username Required
After backfill, make username required:

```prisma
model User {
  username String @unique // Remove the ?
}
```

Then run:
```bash
npx prisma db push
```

### 2. Add Username to Settings UI
Add username field to `/settings` page:

```typescript
<input
  type="text"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  placeholder="username"
/>
```

### 3. Add Username Validation UI
Show real-time validation:

```typescript
const checkUsername = async (username: string) => {
  const res = await fetch(`/api/check-username?username=${username}`);
  const data = await res.json();
  
  if (!data.available) {
    setError("Username taken");
  }
};
```

### 4. Username Change History
Track username changes:

```prisma
model UsernameHistory {
  id        String   @id @default(cuid())
  userId    String
  oldUsername String
  newUsername String
  changedAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
}
```

## Troubleshooting

### Issue: Prisma client error after migration

**Solution:**
```bash
npx prisma generate
npm run dev
```

### Issue: TypeScript errors about username

**Solution:**
```bash
# Restart TypeScript server
# In VSCode: Cmd+Shift+P → "Restart TS Server"
```

### Issue: User has no username

**Cause:** Backfill script not run or failed

**Solution:**
```bash
# Check database
npx prisma studio

# Re-run backfill
npx tsx prisma/fix-usernames.ts
```

### Issue: "Profile not found"

**Cause:** Username doesn't exist or is reserved

**Solution:**
1. Check database for exact username
2. Check if username is in reserved list
3. Try lowercase version

## Files Modified

- ✅ `prisma/schema.prisma` - Added username field
- ✅ `prisma/fix-usernames.ts` - Backfill script
- ✅ `types/next-auth.d.ts` - TypeScript types
- ✅ `lib/auth.config.ts` - Auth configuration
- ✅ `components/user-menu.tsx` - Profile link
- ✅ `app/api/profile/route.ts` - Username API
- ✅ `app/[username]/page.tsx` - Profile page
- ✅ `lib/constants.ts` - Validation (already exists)

## Summary

✅ **Database:** Username column added
✅ **Backfill:** Script ready to generate usernames
✅ **Types:** NextAuth types updated
✅ **Auth:** Username in JWT/session
✅ **UI:** Profile links use username
✅ **API:** Username validation & updates
✅ **Protection:** Reserved names checked

**Status:** Ready to migrate! Follow steps above.

## Next Steps

1. **Apply migration:** `npx prisma db push`
2. **Run backfill:** `npx tsx prisma/fix-usernames.ts`
3. **Verify:** `npx prisma studio`
4. **Restart:** `npm run dev`
5. **Test:** Visit `/[username]` pages

**Ready!** 🚀
