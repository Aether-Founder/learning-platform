# Admin Portal Security Guide

## Overview

The admin portal is located at `/admin` and provides a GUI for managing platform content, viewing analytics, and controlling various administrative functions. This guide explains how to securely access and configure the admin portal.

## Current Security Implementation

### Authentication Method

The admin portal uses secure server-side authentication via API route:

1. **Server-Side Authentication** (Maximum security)
   - Both email and password are validated server-side only
   - Credentials never exposed to the browser
   - Uses secure API route `/api/admin/auth`
   - Both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are server-side only
   - No client-side access to any admin credentials

## Environment Variables

### Required Environment Variables

#### For Local Development (.env.local)

```env
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-admin-password
```

#### For Vercel Deployment

Set these in your Vercel project settings:

- `ADMIN_EMAIL` - Your admin email address
- `ADMIN_PASSWORD` - Your admin password

### Variable Details

- **`ADMIN_EMAIL`**
  - Purpose: Email address for admin authentication
  - Scope: Private (server-side only - maximum security)
  - Format: Single email address only
  - Example: `admin@example.com`
  - Note: No `NEXT_PUBLIC_` prefix - never exposed to browser

- **`ADMIN_PASSWORD`**
  - Purpose: Password for admin authentication
  - Scope: Private (server-side only - maximum security)
  - Format: Any string (use strong password)
  - Example: `MyStr0ng!S3cur3#P@ssw0rd`
  - Note: No `NEXT_PUBLIC_` prefix - never exposed to browser

### Setting Up Environment Variables

#### Local Development

1. Copy `ENV_EXAMPLE.txt` to `.env.local` in your project root
2. Replace the placeholder values with your actual email and password
3. Wrap password in quotes if it contains special characters like `#`
4. Restart your development server

#### Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the two required variables with your values
4. Select appropriate environments (Production, Preview, Development)
5. Redeploy your application

## How to Configure Admin Access

### Step 1: Set Up Environment Variables (Required)

#### Local Development

1. Create or edit `.env.local` file in your project root
2. Add the required environment variables:
   ```env
   ADMIN_EMAIL=your-email@example.com
   ADMIN_PASSWORD=your-secure-admin-password
   ```
3. Replace with your actual email and a strong password
4. Wrap password in quotes if it contains special characters like `#`
5. Restart your development server

#### Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:
   - Name: `ADMIN_EMAIL`, Value: `your-email@example.com`
   - Name: `ADMIN_PASSWORD`, Value: `your-secure-admin-password`
4. Select the appropriate environments (Production, Preview, Development)
5. Redeploy your application

### Step 2: Make Admin Visible in Navbar (Optional)

The admin portal is currently hidden from the navbar by default. To make it accessible:

1. Open `hooks/useNavbarPreferences.ts`
2. Find the `DEFAULT_VISIBILITY` object
3. Change `admin: false` to `admin: true`:
   ```typescript
   const DEFAULT_VISIBILITY: NavVisibility = {
     // ... other settings
     admin: true, // Change from false to true
   };
   ```

## How to Access the Admin Portal

## How to Configure Admin Access

### Step 1: Set Up Environment Variables

#### Local Development

1. Create or edit `.env.local` file in your project root
2. Add the required environment variables:
   ```env
   NEXT_PUBLIC_ADMIN_EMAIL=your-email@example.com
   ADMIN_PASSWORD=your-secure-admin-password
   ```
3. Replace with your actual email and a strong password
4. Restart your development server

#### Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:
   - Name: `NEXT_PUBLIC_ADMIN_EMAIL`, Value: `your-email@example.com`
   - Name: `ADMIN_PASSWORD`, Value: `your-secure-admin-password`
4. Select the appropriate environments (Production, Preview, Development)
5. Redeploy your application

### Step 2: Make Admin Visible in Navbar

The admin portal is currently hidden from the navbar by default. To make it accessible:

1. Open `hooks/useNavbarPreferences.ts`
2. Find the `DEFAULT_VISIBILITY` object
3. Change `admin: false` to `admin: true`:
   ```typescript
   const DEFAULT_VISIBILITY: NavVisibility = {
     // ... other settings
     admin: true, // Change from false to true
   };
   ```

### Method 1: Direct URL (Recommended)

Simply navigate to: `https://your-domain.com/admin`

### Method 2: Through Navbar

If you've made admin visible in the navbar:

1. Click on "Admin" in the navigation bar
2. Enter your admin email and password
3. You'll be authenticated via the secure API route

### Method 3: Through Existing Admin Pages

The admin portal links to existing admin pages:

- `/admin/analytics` - User analytics and statistics
- `/admin/artisan` - Artisan AI queue management
- `/admin/lessons` - Lesson content management

## Authentication Flow

### How Server-Side Authentication Works

1. **User enters credentials**: Email and password in the login form
2. **Client sends to API**: Credentials sent to `/api/admin/auth` endpoint
3. **Server validates**: API route checks against environment variables
4. **Response returned**: Success or failure response sent back
5. **Session established**: Client sets authentication state on success
6. **Portal loads**: Admin interface becomes accessible

### API Route Details

**Location**: `app/api/admin/auth/route.ts`

**Security Features**:

- Server-side only execution
- Environment variable validation
- No credential exposure to browser
- Error handling for missing configuration
- Secure HTTP POST method

**Request Format**:

```json
{
  "email": "admin@example.com",
  "password": "your-secure-password"
}
```

**Response Format** (Success):

```json
{
  "success": true,
  "message": "Authentication successful"
}
```

**Response Format** (Error):

```json
{
  "error": "Invalid credentials"
}
```

## Security Best Practices

### Current Implementation

The current implementation provides maximum security:

- **Server-side only authentication** via API route
- **Both credentials server-side only** - no `NEXT_PUBLIC_` prefix
- **Zero client-side exposure** - credentials never reach the browser
- **Secure API endpoint** - `/api/admin/auth` handles authentication
- **No hardcoded credentials** - everything in environment variables
- **Maximum security** - this is the most secure approach possible

### Why This Approach is More Secure

**Previous approach** (with `NEXT_PUBLIC_ADMIN_EMAIL`):

- Email was exposed in browser bundle
- Anyone could inspect and see the admin email
- Lower security but better UX

**Current approach** (both server-side):

- No credentials ever exposed to browser
- Maximum security possible
- Slightly less convenient (requires manual login)
- Best for production environments

### Additional Security Measures for Production

#### 2. Session Management

Implement proper session management:

- Use secure HTTP-only cookies
- Set appropriate session timeouts
- Implement CSRF protection

#### 4. IP Whitelisting (Optional)

Restrict admin access to specific IP addresses:

```typescript
const ALLOWED_IPS = ['your-ip-address', 'office-ip'];

function isIPAllowed(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  return ALLOWED_IPS.includes(ip);
}
```

#### 5. Audit Logging

Log all admin actions for security monitoring:

```typescript
async function logAdminAction(action: string, userId: string) {
  await supabase.from('admin_audit_log').insert({
    action,
    user_id: userId,
    timestamp: new Date().toISOString(),
    ip_address: getClientIP(),
  });
}
```

## Current Access Flow

1. User navigates to `/admin`
2. Admin portal login screen is displayed
3. User enters admin email and password
4. Credentials are sent to secure API route `/api/admin/auth`
5. Server validates against `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables
6. If credentials match, authentication successful
7. Admin portal loads with full access
8. No credentials are ever exposed to the browser

## Troubleshooting

### Issue: Can't access admin portal

**Solution:**

- Navigate to `/admin` directly
- Enter both admin email and password
- Ensure both environment variables are set correctly
- Check the API route is working (`/api/admin/auth`)

### Issue: Getting "Invalid credentials" error

**Solution:**

- Verify `ADMIN_EMAIL` environment variable matches exactly what you enter
- Verify `ADMIN_PASSWORD` environment variable matches exactly what you enter
- Check for extra spaces or typos in both variables
- Ensure you're using the correct credentials from environment variables
- Wrap password in quotes if it contains special characters

### Issue: Getting "Admin credentials not configured" error

**Solution:**

- Ensure both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set
- Check your `.env.local` file for local development
- Verify Vercel environment variables for production
- Restart your development server after changing variables

### Issue: Admin link not visible in navbar

**Solution:**

- Check `hooks/useNavbarPreferences.ts`
- Ensure `admin: true` in `DEFAULT_VISIBILITY`
- Refresh the page to apply changes

### Issue: Environment variables not loading

**Solution:**

- Ensure `.env.local` file is in the project root
- Check that variable names are exactly correct (case-sensitive)
- Verify no typos in variable names
- Restart your development server
- For Vercel, check environment variable names in project settings

### Issue: API authentication failing

**Solution:**

- Check that the API route file exists at `app/api/admin/auth/route.ts`
- Verify the API route is properly deployed on Vercel
- Check server logs for API route errors
- Ensure environment variables are accessible to the API route

## Content Management Security

The admin portal allows adding global content via JSON. To ensure security:

### JSON Validation

- All JSON is validated against schemas before submission
- Invalid JSON is rejected with error messages
- Only properly formatted content is accepted

### Database Permissions

- Ensure your Supabase setup has proper RLS (Row Level Security)
- Admin operations should have appropriate permissions
- Consider creating a separate admin role in Supabase

### Content Moderation

- Review all added content before making it live
- Implement content approval workflow if needed
- Regular audit of added content

## Recommendations

1. **Use Strong Passwords**: Always use strong, unique passwords for `ADMIN_PASSWORD`
2. **Single Admin Email**: Use only one trusted email for `ADMIN_EMAIL`
3. **Environment Variables**: Never commit `.env.local` or hardcode credentials
4. **Server-Side Only**: Keep all credentials server-side only (no `NEXT_PUBLIC_` prefix)
5. **Regular Security Reviews**: Periodically review admin access logs
6. **Keep Software Updated**: Keep dependencies and frameworks updated
7. **Backup Data**: Regular backups of the database
8. **Monitor Activity**: Set up monitoring for suspicious admin activities
9. **Password Rotation**: Regularly rotate your admin password
10. **API Security**: Monitor and secure your API endpoints

## Future Security Enhancements

Consider implementing these for better security:

1. **Two-Factor Authentication (2FA)**
2. **OAuth Integration** (Google, GitHub auth)
3. **Role-Based Access Control (RBAC)**
4. **Time-based Access Tokens**
5. **Hardware Security Keys**
6. **Biometric Authentication**

## Quick Setup Guide

### For Local Development

1. Copy `ENV_EXAMPLE.txt` to `.env.local`
2. Fill in your actual email and password
3. Restart development server
4. Navigate to `/admin`

### For Vercel Deployment

1. Go to Vercel project Settings → Environment Variables
2. Add `NEXT_PUBLIC_ADMIN_EMAIL` with your email
3. Add `ADMIN_PASSWORD` with a strong password
4. Redeploy the application
5. Navigate to `/admin`

## Support

If you encounter security issues or need help with admin portal configuration:

- Check the configuration error screen for missing variables
- Verify environment variables are set correctly
- Check the application logs for error messages
- Ensure Supabase permissions are correctly set
- Contact technical support if issues persist

---

**⚠️ Important Security Notice:**

- Never commit `.env.local` file to version control
- Use strong, unique passwords for `ADMIN_PASSWORD`
- Never share your admin credentials
- Regularly rotate your admin password
- Use different passwords for development and production
- Both credentials are server-side only - maximum security
- No `NEXT_PUBLIC_` prefix for any admin credentials
