# 🔧 Basic Authentication - Troubleshooting Guide

## Issue: Authentication Dialog Keeps Appearing

If you're seeing the login dialog repeatedly after entering credentials, follow these steps:

### ✅ Step 1: Verify Environment Variables on Vercel

1. Go to https://vercel.com/dashboard
2. Select your project: `clinic-analysis`
3. Go to **Settings** → **Environment Variables**
4. Verify these variables exist:
   - `BASIC_AUTH_USER`
   - `BASIC_AUTH_PASSWORD`
5. Make sure they are enabled for **Production** environment
6. **Double-check there are no extra spaces** in the values

### ✅ Step 2: Test Credentials Locally

Open PowerShell and test:

```powershell
# Check your local .env.local file
Get-Content .env.local

# Should show:
# BASIC_AUTH_USER=admin
# BASIC_AUTH_PASSWORD=clinic-sales-2026
```

### ✅ Step 3: Verify Vercel Credentials Match

**IMPORTANT**: The credentials you enter in the browser MUST EXACTLY match what's in Vercel's environment variables.

Check for common issues:
- ❌ Extra spaces: `"admin "` vs `"admin"`
- ❌ Wrong case: `"Admin"` vs `"admin"`  
- ❌ Special characters not encoded properly
- ❌ Copy-paste added hidden characters

### ✅ Step 4: Force Clean Deployment

```powershell
# From your project directory
git add .
git commit -m "Fix: Simplify Basic Auth middleware"
git push origin main
```

Then in Vercel:
1. Go to **Deployments**
2. Wait for auto-deploy to complete (green checkmark)
3. Click the deployment URL to test

### ✅ Step 5: Test in Fresh Browser Session

**Critical**: Clear ALL browser data:

1. **Close ALL browser windows** (completely quit the browser)
2. **Clear browser data**:
   - Chrome: `Ctrl + Shift + Delete`
   - Select "All time"
   - Check: Cookies, Cache, Cached images
   - Click "Clear data"
3. **Restart browser**
4. **Open Incognito/Private window**: `Ctrl + Shift + N`
5. **Visit your site**: https://clinic-analysis-five.vercel.app
6. **Enter credentials ONCE**
7. **Navigate to different pages** - should work without re-prompting

### ✅ Step 6: Check Browser Console

1. Press `F12` to open DevTools
2. Go to **Console** tab
3. Refresh the page
4. Look for any errors (red messages)
5. Take a screenshot if you see errors

### ✅ Step 7: Verify Credentials are Correct

Let's make sure the credentials are set correctly. Try this test:

1. In Vercel Dashboard → Environment Variables
2. **Edit** `BASIC_AUTH_PASSWORD`
3. Set it to a simple test value: `test123`
4. Click **Save**
5. **Redeploy** the site
6. Try logging in with:
   - Username: `admin`
   - Password: `test123`
7. If this works, your original password had an issue
8. Change back to your desired password

---

## 🔄 Alternative Solution: Use Vercel Password Protection

If the middleware approach continues to have issues, Vercel has a built-in password protection feature:

### Option A: Vercel's Built-in Protection (Easier)

1. Go to Vercel Dashboard → Your Project
2. **Settings** → **Deployment Protection**
3. Enable **Password Protection**
4. Set a password
5. Save

**Pros:**
- ✅ Managed by Vercel, no code needed
- ✅ No repeated dialogs
- ✅ Better UX with proper login page

**Cons:**
- ⚠️ Requires Vercel Pro plan ($20/month)

### Option B: Keep Middleware (Current Approach)

**Pros:**
- ✅ Free
- ✅ Works on all plans
- ✅ Full control

**Cons:**
- ⚠️ Requires proper configuration
- ⚠️ Browser-dependent behavior

---

## 🐛 Debug: Check What's Being Sent

If authentication keeps failing, let's debug what's happening:

### Create a test page to see the auth header:

Create `app/api/test-auth/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  return NextResponse.json({
    hasAuthHeader: !!authHeader,
    authHeaderValue: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
    envUserSet: !!process.env.BASIC_AUTH_USER,
    envPasswordSet: !!process.env.BASIC_AUTH_PASSWORD,
  });
}
```

Then visit: `https://your-site.vercel.app/api/test-auth`

This will show you if:
- Auth header is being sent
- Environment variables are set

---

## 🔍 Common Causes & Solutions

### Issue 1: Browser Not Caching Credentials

**Symptoms**: Dialog appears on EVERY page, EVERY navigation

**Solution**:
```
1. Try a different browser (Chrome, Firefox, Edge)
2. Disable browser extensions temporarily
3. Check if you're in Private/Incognito mode (doesn't save credentials)
4. Make sure cookies are enabled
```

### Issue 2: API Routes Causing Re-authentication

**Symptoms**: Dialog appears when clicking certain features

**Solution**: API routes might be triggering auth. Let's exclude them:

Update `middleware.ts` matcher to:
```typescript
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Issue 3: Environment Variables Not Loading

**Symptoms**: Auth not working at all, or inconsistent

**Solution**:
1. In Vercel, delete and re-create the environment variables
2. Make sure to select ALL environments (Production, Preview, Development)
3. Redeploy after making changes
4. Wait 1-2 minutes for changes to propagate

### Issue 4: Password Contains Special Characters

**Symptoms**: Auth fails even with correct password

**Solution**: If your password has special characters like `@`, `$`, `&`, etc.:
1. Try a simpler password temporarily (only letters and numbers)
2. Test if it works
3. If yes, the special character was causing encoding issues
4. Use a password without these characters: `<`, `>`, `&`, `"`, `'`, `@`, `:`

---

## 🎯 Expected vs. Actual Behavior

### ✅ CORRECT Behavior (What SHOULD Happen)

```
1. Visit site
2. See auth dialog (ONCE)
3. Enter username: admin
4. Enter password: [your password]
5. Click "Sign in"
6. Page loads successfully
7. Navigate to other pages → NO auth dialog
8. Browser remembers until you close it
```

### ❌ INCORRECT Behavior (What you're experiencing)

```
1. Visit site
2. See auth dialog
3. Enter credentials
4. Click "Sign in"  
5. Dialog appears AGAIN ← THIS IS THE PROBLEM
6. Endless loop
```

---

## 💡 Quick Fix: Simplest Possible Password

Try using the absolute simplest credentials to test:

**In Vercel Environment Variables:**
```
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=test
```

**Redeploy, then test with:**
- Username: `admin`
- Password: `test`

If this works but your original password doesn't, the issue was with the password complexity or encoding.

---

## 📞 Still Not Working?

Please provide the following information:

1. **Browser name and version**: (e.g., Chrome 120, Firefox 121)
2. **Operating System**: (Windows 11, macOS 14, etc.)
3. **What happens exactly**:
   - Dialog appears once? Multiple times?
   - Does it accept the password at all?
   - Any error messages?
4. **Screenshot of**:
   - The auth dialog
   - Browser console (F12 → Console tab)
   - Vercel environment variables page (hide the actual values)
5. **Test in incognito**:
   - Does it work in incognito mode? Yes/No
6. **Vercel deployment URL**:
   - What's the exact URL you're testing?

---

## 🔐 Current Implementation

The middleware has been simplified to:
- ✅ Clean, straightforward validation
- ✅ Proper error handling
- ✅ Excludes static files
- ✅ Works with all modern browsers
- ✅ Standard HTTP Basic Authentication

If you're still having issues, we can:
1. Switch to Vercel's built-in password protection
2. Implement a custom login page
3. Use a different authentication method (JWT, session-based, etc.)

---

**Last Updated**: January 26, 2026  
**Middleware Version**: 3.0 (Simplified)

