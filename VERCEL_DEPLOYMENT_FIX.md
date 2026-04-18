# 🚀 Vercel 404 Fix Guide

## Problem: Getting 404 on Vercel Deployment

Your app works locally but shows 404 on Vercel. Here's how to fix it:

---

## ⚠️ CRITICAL ISSUE: Client-Side Root Layout

**Your `src/app/layout.tsx` starts with `'use client'`** - This is the problem!

### Why This Causes 404:
- Next.js root layout MUST be a Server Component
- `'use client'` makes it a Client Component
- Vercel can't render the page properly
- Results in 404 error

---

## 🔧 SOLUTION 1: Fix Root Layout (RECOMMENDED)

We need to separate client and server logic:

### Step 1: Create a new Client Layout Component

Create `src/components/layouts/client-layout.tsx`:

```typescript
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/database/provider';
import { CollapsibleSidebar } from '@/components/shared/collapsible-sidebar';
import * as React from 'react';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isUserLoading) return;

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
  }, [user, isUserLoading, isAuthenticated, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <CollapsibleSidebar />
      <div className="flex flex-col flex-1 ml-20">
        <main className="flex-1 overflow-auto p-6 md:p-8 bg-gradient-to-br from-background via-background/95 to-background/90">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

### Step 2: Update Root Layout

Update `src/app/layout.tsx`:

```typescript
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { AppDatabaseProvider } from '@/database/provider';
import { KeyboardShortcutsProvider } from '@/components/shared/keyboard-shortcuts-provider';
import { KeyboardShortcutsModal } from '@/components/shared/keyboard-shortcuts-modal';
import { TradingTutorial } from '@/components/shared/trading-tutorial';
import { TranslationProvider } from '@/contexts/translation-context';
import { ClientLayout } from '@/components/layouts/client-layout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Oloo Trading Platform',
  description: 'Trading simulator with real-time market data',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TranslationProvider>
            <AppDatabaseProvider>
              <KeyboardShortcutsProvider>
                <ClientLayout>{children}</ClientLayout>
                <KeyboardShortcutsModal />
                <TradingTutorial />
                <Toaster />
              </KeyboardShortcutsProvider>
            </AppDatabaseProvider>
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Step 3: Handle Auth Pages

Update `src/components/layouts/client-layout.tsx` to handle auth pages:

```typescript
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/database/provider';
import { CollapsibleSidebar } from '@/components/shared/collapsible-sidebar';
import * as React from 'react';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { isAuthenticated } = useAuth();

  // Check if current page is an auth page
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname);

  React.useEffect(() => {
    if (isUserLoading) return;

    // Redirect to login if not authenticated and not on auth page
    if (!isAuthenticated && !isAuthPage) {
      router.replace('/login');
      return;
    }

    // Redirect to dashboard if authenticated and on auth page
    if (isAuthenticated && isAuthPage) {
      router.replace('/');
      return;
    }
  }, [user, isUserLoading, isAuthenticated, router, pathname, isAuthPage]);

  // Show loading for non-auth pages while checking authentication
  if (!isAuthPage && (isUserLoading || !user)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  // Auth pages render without sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Protected pages render with sidebar
  return (
    <div className="flex h-screen bg-background">
      <CollapsibleSidebar />
      <div className="flex flex-col flex-1 ml-20">
        <main className="flex-1 overflow-auto p-6 md:p-8 bg-gradient-to-br from-background via-background/95 to-background/90">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

---

## 🔧 SOLUTION 2: Check Environment Variables

### Verify Vercel Environment Variables:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Make sure you have ALL these variables:

```bash
```

⚠️ **IMPORTANT**: 
- `NEXTAUTH_URL` should be your Vercel URL (not localhost)
- Example: `https://oloo-trading.vercel.app`

### How to Add Environment Variables in Vercel:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Settings** tab
4. Click **Environment Variables** in sidebar
5. Add each variable:
   - **Key**: `MONGODB_URI`
   - **Value**: `mongodb+srv://...`
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**
7. Repeat for all variables

---

## 🔧 SOLUTION 3: Redeploy After Changes

After making the layout changes:

```bash
# Commit your changes
git add .
git commit -m "fix: Convert root layout to server component"
git push origin main
```

Vercel will automatically redeploy. Or manually trigger:

1. Go to Vercel Dashboard
2. Click **Deployments** tab
3. Click **Redeploy** on the latest deployment

---

## 🔧 SOLUTION 4: Check Build Logs

If still getting 404:

1. Go to Vercel Dashboard
2. Click **Deployments**
3. Click on the latest deployment
4. Check **Build Logs** for errors

Common errors:
- TypeScript errors
- Missing dependencies
- Build failures

---

## 🔧 SOLUTION 5: Database Seeding

Your MongoDB might be empty! Run the seed script:

```bash
# Locally (make sure MONGODB_URI points to production DB)
npm run seed
```

Or create a Vercel function to seed:

Create `src/app/api/seed/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { AssetModel, BadgeModel } from '@/lib/models/schemas';
// Import your seed data

export async function GET(request: Request) {
  // Add authentication check here!
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.SEED_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    
    // Clear existing data
    await AssetModel.deleteMany({});
    await BadgeModel.deleteMany({});
    
    // Seed assets
    // ... your seeding logic
    
    return NextResponse.json({ success: true, message: 'Database seeded' });
  } catch (error) {
    return NextResponse.json({ error: 'Seeding failed' }, { status: 500 });
  }
}
```

Then call it:
```bash
curl https://your-app.vercel.app/api/seed \
  -H "Authorization: Bearer YOUR_SECRET"
```

---

## 🔍 DEBUGGING CHECKLIST

- [ ] Root layout is a Server Component (no `'use client'`)
- [ ] All environment variables added to Vercel
- [ ] `NEXTAUTH_URL` points to Vercel URL (not localhost)
- [ ] MongoDB is accessible from Vercel
- [ ] Database has been seeded with data
- [ ] Build completed successfully (check logs)
- [ ] No TypeScript errors in build
- [ ] Redeployed after making changes

---

## 🎯 QUICK FIX STEPS

1. **Remove `'use client'` from `src/app/layout.tsx`**
2. **Create client layout component** (see Solution 1)
3. **Update `NEXTAUTH_URL`** in Vercel to your production URL
4. **Redeploy** from Vercel dashboard
5. **Check build logs** for any errors

---

## 📞 STILL NOT WORKING?

Share these details:

1. **Vercel deployment URL**: `https://your-app.vercel.app`
2. **Build logs** (from Vercel dashboard)
3. **Error message** you're seeing
4. **Browser console errors** (F12 → Console tab)

---

## ⚡ COMMON MISTAKES

### ❌ Wrong:
```typescript
// src/app/layout.tsx
'use client';  // ← This breaks Vercel!

export default function RootLayout({ children }) {
  const pathname = usePathname(); // Client hook in root layout
  // ...
}
```

### ✅ Correct:
```typescript
// src/app/layout.tsx
// No 'use client' directive

export default function RootLayout({ children }) {
  // Server component - no client hooks
  return (
    <html>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
```

---

## 🚀 AFTER FIXING

Once deployed successfully:

1. Visit your Vercel URL
2. You should see the login page
3. Create an account or login
4. Dashboard should load

If you see a blank page or errors, check browser console (F12).

---

## 🔐 SECURITY NOTE

After deployment works, **IMMEDIATELY**:

1. Rotate MongoDB password
2. Generate new `NEXTAUTH_SECRET`
3. Get new Gemini API key
4. Update all in Vercel environment variables

Your credentials are exposed in the codebase!
