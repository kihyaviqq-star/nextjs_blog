# 👤 Root Level Usernames Implementation

## Summary

Implemented root-level user profiles (`domain.com/username`) with comprehensive reserved username protection to prevent conflicts with system routes and static files.

## Architecture

### URL Structure

```
✅ domain.com/nikita          → User profile (Nikita)
✅ domain.com/settings         → System route (Settings page)
✅ domain.com/admin            → System route (Admin panel)
✅ domain.com/api/...          → API routes
✅ domain.com/favicon.ico      → Static file
❌ domain.com/login            → Reserved (cannot be username)
```

## Implementation

### 1. Reserved Username System

**File:** `lib/constants.ts`

#### Reserved List (100+ entries)
```typescript
export const RESERVED_USERNAMES = [
  // System Pages
  "admin", "settings", "login", "auth", "dashboard",
  
  // API & Routes
  "api", "_next", "static", "public",
  
  // Blog & Content
  "blog", "post", "article", "author",
  
  // Static Files
  "favicon", "robots", "sitemap", "manifest",
  
  // File Extensions
  "js", "css", "json", "xml", "html", "txt", "ico",
  
  // ... and more
];
```

#### Validation Functions

**`isUsernameReserved(username: string): boolean`**
- Checks if username is in reserved list
- Case-insensitive comparison
- Checks for reserved patterns (starts with `_`, `-`)
- Checks for file extensions

**`validateUsername(username: string): { valid: boolean; error?: string }`**
- Length: 3-30 characters
- Format: alphanumeric, underscore, hyphen only
- Must start with letter or number
- Checks reserved list
- Returns detailed error messages

**`generateUsernameSlug(name: string): string`**
- Converts display name to URL-safe slug
- Lowercase, replaces spaces with hyphens
- Removes special characters

### 2. Dynamic Profile Page

**File:** `app/[username]/page.tsx`

```typescript
export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;

  // Step 1: Check if reserved
  if (isUsernameReserved(username)) {
    notFound(); // 404 for reserved names
  }

  // Step 2: Fetch user from database
  const user = await getUserByUsername(username);

  if (!user) {
    notFound(); // 404 for non-existent users
  }

  // Step 3: Render profile
  return (
    <div>
      <h1>{user.name}</h1>
      {/* Profile content */}
    </div>
  );
}
```

#### Features:
- ✅ Fetches user from Prisma database
- ✅ Case-insensitive username search
- ✅ Fallback avatar generation
- ✅ Social links display
- ✅ Member since date
- ✅ SEO metadata
- ✅ 404 for reserved/invalid usernames

### 3. Profile API Protection

**File:** `app/api/profile/route.ts`

```typescript
// PUT - Update profile
export async function PUT(request: NextRequest) {
  const { name } = await request.json();

  // Step 1: Validate username format
  const usernameSlug = generateUsernameSlug(name);
  const validation = validateUsername(usernameSlug);
  
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  // Step 2: Check uniqueness
  const existingUser = await prisma.user.findFirst({
    where: {
      AND: [
        { id: { not: userId } }, // Exclude current user
        { name: { equals: name, mode: 'insensitive' } }
      ]
    }
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Это имя пользователя уже занято" },
      { status: 400 }
    );
  }

  // Step 3: Update profile
  await prisma.user.update({ ... });
}
```

## Route Priority

Next.js route resolution order:

1. **Static files** (`public/`)
   - `favicon.ico`, `robots.txt`, `sitemap.xml`

2. **Defined routes** (`app/` directory)
   - `app/settings/page.tsx` → `/settings`
   - `app/admin/page.tsx` → `/admin`
   - `app/api/posts/route.ts` → `/api/posts`

3. **Dynamic routes** (`app/[param]/page.tsx`)
   - `app/[username]/page.tsx` → `/nikita`

**Result:** Static routes always take precedence over dynamic profiles.

## Testing

### Test Scenarios

#### 1. Valid Username
```bash
# Visit profile
http://localhost:3000/nikita

Expected:
✅ User profile page
✅ Shows avatar, bio, social links
✅ 200 OK
```

#### 2. Reserved Username (System Route)
```bash
# Try to visit
http://localhost:3000/admin

Expected:
✅ Admin page (system route)
❌ NOT user profile
✅ 200 OK
```

#### 3. Reserved Username (User Attempts)
```bash
# User tries to set username to "login"

Expected:
❌ Error: "Этот никнейм зарезервирован системой"
✅ Cannot save profile
```

#### 4. Non-Existent User
```bash
# Visit non-existent username
http://localhost:3000/doesnotexist

Expected:
❌ 404 Not Found page
```

#### 5. Username Conflict
```bash
# User A: name = "Nikita"
# User B tries to set name = "nikita" (case-insensitive)

Expected:
❌ Error: "Это имя пользователя уже занято"
```

#### 6. Invalid Format
```bash
# User tries to set username to "ab" (too short)

Expected:
❌ Error: "Имя пользователя должно содержать минимум 3 символа"
```

```bash
# User tries to set username to "user@123" (special chars)

Expected:
❌ Error: "Имя пользователя может содержать только буквы, цифры, дефис и подчеркивание"
```

## Validation Rules

### Length
- **Min:** 3 characters
- **Max:** 30 characters

### Format
- **Allowed:** `a-z`, `A-Z`, `0-9`, `-`, `_`
- **Must start with:** Letter or number
- **Cannot start with:** `_`, `-`

### Reserved Patterns
- **System routes:** `admin`, `api`, `auth`, etc.
- **Static files:** `favicon`, `robots`, `sitemap`
- **File extensions:** `.ico`, `.txt`, `.xml`, etc.

## Database Schema

### User Model (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  name      String   @unique // Used as username
  email     String   @unique
  avatarUrl String?
  bio       String?
  role      String   @default("USER")
  
  // Social links
  linkedin  String?
  twitter   String?
  github    String?
  website   String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Note:** `name` field is used as the username for profile URLs.

## Migration from `/author/[slug]`

### Before
```
URL: /author/sara-chen
File: app/author/[slug]/page.tsx
Data: Mock data from lib/authors.ts
```

### After
```
URL: /sara-chen (or /Сара-Чен)
File: app/[username]/page.tsx
Data: Database (Prisma)
```

### Coexistence
Both routes can coexist:
- `/author/[slug]` - For legacy support (mock data)
- `/[username]` - For user profiles (database)

## User Flow

### Changing Username

```
User goes to /settings
    ↓
Changes name from "John" to "Nikita"
    ↓
Clicks "Сохранить"
    ↓
API validates:
  1. Format: ✅ Valid (letters only)
  2. Length: ✅ 6 characters (3-30)
  3. Reserved: ✅ Not in list
  4. Unique: ✅ No other user has "Nikita"
    ↓
Profile updated in DB
    ↓
Session refreshes
    ↓
User can access profile at:
  - /nikita
  - /Nikita (case-insensitive)
```

### Visiting Profile

```
User visits /nikita
    ↓
Next.js checks routes:
  1. Static files? ❌ No /nikita file
  2. Defined routes? ❌ No app/nikita/page.tsx
  3. Dynamic routes? ✅ app/[username]/page.tsx
    ↓
Dynamic route handler:
  1. isUsernameReserved("nikita")? ❌ No
  2. User exists in DB? ✅ Yes
    ↓
Render profile page
```

## Security Considerations

### 1. SQL Injection
- ✅ Using Prisma ORM (prevents SQL injection)
- ✅ Parameterized queries

### 2. XSS Prevention
- ✅ React auto-escapes content
- ✅ No `dangerouslySetInnerHTML`

### 3. Case Sensitivity
- ✅ Case-insensitive searches
- ✅ Prevents duplicate usernames with different cases

### 4. Reserved Route Protection
- ✅ 100+ reserved keywords
- ✅ File extensions blocked
- ✅ System routes protected

### 5. Username Squatting
- ✅ Reserved list prevents critical usernames
- ✅ Can add rate limiting if needed

## Future Enhancements

### 1. Custom Username Field
Add dedicated `username` field to User model:

```prisma
model User {
  id        String   @id @default(cuid())
  name      String   // Display name
  username  String   @unique // URL username
  // ...
}
```

**Benefits:**
- Separate display name from URL
- Display name can have spaces/special chars
- Username stays URL-safe

### 2. Username History
Track username changes:

```prisma
model UsernameHistory {
  id        String   @id @default(cuid())
  userId    String
  username  String
  changedAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
}
```

### 3. Username Redirects
Redirect old usernames to new ones:

```typescript
// If user changed from "john" to "nikita"
// Redirect /john → /nikita
```

### 4. Vanity URLs
Allow custom vanity URLs:

```typescript
model User {
  username    String  @unique // Default: sara-chen
  vanityUrl   String? @unique // Custom: sara
}

// Access profile at:
// - /sara-chen (default)
// - /sara (vanity, if set)
```

### 5. Username Marketplace
Allow users to trade/sell usernames:

```typescript
model UsernameOffer {
  id        String   @id @default(cuid())
  username  String
  price     Int
  sellerId  String
  // ...
}
```

## Troubleshooting

### Issue: 404 on valid username

**Cause:** User doesn't exist or username is reserved

**Solution:**
1. Check if user exists in database: `npx prisma studio`
2. Check if username is in reserved list
3. Check spelling (case-insensitive)

### Issue: Can't set desired username

**Cause:** Username is reserved or taken

**Solutions:**
1. Check reserved list in `lib/constants.ts`
2. Try variation: `nikita` → `nikita-dev`, `nikita_ai`
3. Contact admin to release reserved name

### Issue: Static route returns user profile

**Cause:** Static route not defined correctly

**Solution:**
1. Ensure static route exists (e.g., `app/settings/page.tsx`)
2. Clear `.next` cache: `rm -rf .next`
3. Restart dev server

### Issue: Profile page shows wrong user

**Cause:** Database query issue or cache

**Solution:**
1. Check database: `npx prisma studio`
2. Clear browser cache
3. Restart dev server
4. Check console logs

## API Endpoints

### GET /api/check-username?username=nikita
Check if username is available

```typescript
// Response
{
  available: boolean,
  reserved: boolean,
  taken: boolean,
  error?: string
}
```

### PUT /api/profile
Update user profile (includes username validation)

```typescript
// Request
{
  name: "Nikita", // Username
  bio: "...",
  // ...
}

// Response (Success)
{
  id: "...",
  name: "Nikita",
  // ...
}

// Response (Error)
{
  error: "Этот никнейм зарезервирован системой"
}
```

## Summary

✅ **Implemented:** Root-level user profiles (`/username`)
✅ **Protected:** 100+ reserved usernames
✅ **Validated:** Format, length, uniqueness checks
✅ **Integrated:** Prisma database queries
✅ **SEO-friendly:** Metadata generation
✅ **404 handling:** Reserved and non-existent users
✅ **API protection:** Username validation on save

**Result:** Clean, SEO-friendly profile URLs with comprehensive protection! 🎉

## Files Created/Modified

- ✅ `lib/constants.ts` - Reserved list & validation
- ✅ `app/[username]/page.tsx` - Dynamic profile page
- ✅ `app/api/profile/route.ts` - Username validation
- ✅ `ROOT-LEVEL-USERNAMES.md` - This documentation

**Ready to test!** 🚀
