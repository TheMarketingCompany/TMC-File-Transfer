# 🔐 Cloudflare Zero Trust Setup Guide

This guide will help you configure Cloudflare Zero Trust to restrict file uploads to authorized users while keeping downloads public for everyone.

## Overview

After implementing Zero Trust:
- ✅ **Uploads**: Only authenticated/authorized users can upload files
- ✅ **Downloads**: Anyone with the link can download files (remains public)
- ✅ **Admin Functions**: Database migration and configuration endpoints protected
- ✅ **Seamless Integration**: Works with existing Turnstile bot protection

## Prerequisites

- Active Cloudflare account with your domain
- TMC File Transfer deployed and working
- Admin access to Cloudflare dashboard
- Zero Trust plan (Free plan includes 50 users)

## Step 1: Enable Cloudflare Zero Trust

### 1.1 Activate Zero Trust

1. **Go to Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Select "Zero Trust"** from the left sidebar
3. **Choose your team name** (this will be part of your authentication URL)
4. **Select plan**: Free plan supports up to 50 users
5. **Complete setup** and verify your team domain

### 1.2 Configure Identity Provider

Choose your preferred authentication method:

**Option A: Email OTP (Simplest)**
1. Go to **Settings > Authentication**
2. Click **Add new** identity provider
3. Select **One-time PIN**
4. Configure email domains you want to allow
5. Save configuration

**Option B: Google OAuth (Recommended)**
1. Go to **Settings > Authentication** 
2. Click **Add new** identity provider
3. Select **Google**
4. Follow the OAuth setup instructions
5. Configure allowed Google domains/users

**Option C: Microsoft Azure AD**
1. Go to **Settings > Authentication**
2. Click **Add new** identity provider  
3. Select **Azure AD**
4. Configure with your Azure tenant information

## Step 2: Create Zero Trust Application

### 2.1 Create Application for Upload Protection

1. **Go to Access > Applications**
2. **Click "Add an application"**
3. **Select "Self-hosted"**
4. **Configure Application:**

```
Application name: TMC File Transfer - Uploads
Session Duration: 24 hours
Application domain: your-domain.pages.dev
```

### 2.2 Configure Protected Paths

**Add these paths to protect upload endpoints:**

```
Subdomain: your-app-name
Domain: pages.dev
Path: /api/transfer/upload*
```

**Include these paths:**
- `/api/transfer/upload` - Standard uploads
- `/api/transfer/upload-multipart*` - Large file uploads  
- `/api/db/migrate` - Database migrations (admin only)
- `/api/config` - Configuration endpoint (optional)

**Exclude these paths (keep public):**
- `/api/transfer/download/*` - File downloads
- `/api/transfer/info/*` - File information  
- `/api/transfer/validate/*` - File validation
- `/` - Frontend application

### 2.3 Create Access Policies

**Policy 1: Upload Access for Authorized Users**

```
Policy name: Authorized Uploaders
Action: Allow
Session duration: 24 hours
```

**Rules (choose one):**

*Option A: Email Domain Based*
```
Selector: Emails
Value: @yourcompany.com
```

*Option B: Specific Users*
```  
Selector: Emails
Value: user1@example.com, user2@example.com, admin@example.com
```

*Option C: Google Group (if using Google OAuth)*
```
Selector: Google Groups
Value: file-upload-users@yourcompany.com
```

**Policy 2: Admin Access for Database Operations**

```
Policy name: Admin Only
Action: Allow
Include paths: /api/db/migrate
Session duration: 4 hours
```

**Rules:**
```
Selector: Emails  
Value: admin@yourcompany.com
```

## Step 3: Configure Application Integration

### 3.1 Update Frontend for Authentication

The frontend needs to handle authentication redirects. Add this to your upload page:

**Option A: Automatic Redirect (Seamless)**

Add to `src/components/UploadPageNew.vue` in the upload method:

```javascript
// Check if user is authenticated before upload
async handleUpload() {
  try {
    // Your existing upload code
    await this.uploadFile();
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      // Redirect to Cloudflare authentication
      window.location.href = '/api/transfer/upload';
      return;
    }
    // Handle other errors normally
    console.error('Upload failed:', error);
  }
}
```

**Option B: Authentication Check Button**

Add an authentication check before showing upload interface:

```vue
<template>
  <div v-if="!isAuthenticated" class="auth-required">
    <md-filled-button @click="authenticate">
      <md-icon slot="icon">login</md-icon>
      Sign in to Upload Files
    </md-filled-button>
  </div>
  
  <div v-else class="upload-interface">
    <!-- Your existing upload UI -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      isAuthenticated: false
    };
  },
  
  async mounted() {
    await this.checkAuthentication();
  },
  
  methods: {
    async checkAuthentication() {
      try {
        // Try accessing a protected endpoint
        const response = await fetch('/api/config');
        this.isAuthenticated = response.status === 200;
      } catch (error) {
        this.isAuthenticated = false;
      }
    },
    
    authenticate() {
      // Redirect to trigger Zero Trust authentication
      window.location.href = '/api/transfer/upload';
    }
  }
};
</script>
```

### 3.2 Update Environment Variables

Add Zero Trust configuration to your `wrangler.toml`:

```toml
[env.production.vars]
ZERO_TRUST_ENABLED = "true"
ZERO_TRUST_TEAM_DOMAIN = "your-team-name.cloudflareaccess.com"

[env.preview.vars]  
ZERO_TRUST_ENABLED = "false"  # Disable for preview/development
```

### 3.3 Handle Authentication Headers (Optional)

If you need user information in your API functions, you can access Cloudflare Access headers:

```typescript
// In your API functions (e.g., functions/api/transfer/upload.ts)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  // Get authenticated user information
  const userEmail = request.headers.get('CF-Access-Authenticated-User-Email');
  const userID = request.headers.get('CF-Access-Authenticated-User-ID');
  
  console.log(`Upload by authenticated user: ${userEmail}`);
  
  // Your existing upload logic...
};
```

## Step 4: Test Zero Trust Configuration

### 4.1 Test Upload Protection

1. **Open your site in incognito/private browser**
2. **Try to upload a file directly** 
3. **Should redirect to authentication page**
4. **After authentication, upload should work**

### 4.2 Test Download Access (Should Remain Public)

1. **Get a file download link**
2. **Open in incognito/private browser** 
3. **Download should work without authentication**

### 4.3 Test Different User Types

**Test authorized user:**
1. Sign in with authorized email
2. Upload should work normally

**Test unauthorized user:**
1. Try signing in with non-authorized email
2. Should be blocked with access denied message

## Step 5: Advanced Configuration

### 5.1 Custom Access Denied Page

Create a custom blocked page:

1. **Go to Access > Settings > Custom pages**
2. **Upload custom HTML for blocked page**
3. **Include helpful information about requesting access**

### 5.2 Audit Logs

Enable comprehensive logging:

1. **Go to Logs > Access requests**
2. **Configure log retention** 
3. **Set up alerts for failed authentication attempts**

### 5.3 Session Management

Configure session behavior:

```
Settings > Authentication > Session management
- Session duration: 24 hours (recommended)
- Require fresh login: For sensitive operations
- Session refresh: Before expiration
```

### 5.4 IP-Based Rules (Optional)

Add IP restrictions for extra security:

```
Policy rules:
- Include: Authorized emails
- Exclude: High-risk countries
- Include: Office IP ranges
```

## Step 6: User Onboarding

### 6.1 User Instructions

Provide these instructions to authorized users:

```
# File Upload Access Instructions

1. Go to https://your-domain.pages.dev
2. Click "Upload Files" 
3. You'll be redirected to sign in
4. Use your authorized email address
5. Complete authentication (email code or OAuth)
6. You'll return to the upload page automatically
7. Upload your files normally

Note: Downloads don't require authentication - anyone with the link can download files.
```

### 6.2 Adding New Users

To authorize new users:

1. **Go to Access > Applications > Your App**
2. **Edit the "Authorized Uploaders" policy**
3. **Add new email addresses**
4. **Save changes** (takes effect immediately)

## Troubleshooting

### Common Issues

**"Access Denied" for Authorized Users**
- Check email address matches exactly (case sensitive)
- Verify identity provider is configured correctly
- Check policy rules include their email/domain

**Downloads Require Authentication**
- Verify download paths are excluded from Zero Trust application
- Check application path configuration doesn't include download endpoints

**Authentication Loop**
- Clear browser cookies for the domain
- Check session duration settings
- Verify application domain matches your actual domain

**Users Can't Sign In**
- Check identity provider configuration
- Verify email domain is allowed
- Test with different browsers

### Debug Commands

```bash
# Check Zero Trust application status
curl -H "CF-Access-Client-Id: xxx" \
     -H "CF-Access-Client-Secret: xxx" \
     "https://your-team.cloudflareaccess.com/cdn-cgi/access/get-identity"

# Test protected endpoint
curl -v https://your-domain.pages.dev/api/transfer/upload

# Test public endpoint (should work)
curl -v https://your-domain.pages.dev/api/transfer/info/test-id
```

## Security Best Practices

### 1. Principle of Least Privilege
- Only grant upload access to users who need it
- Use specific email addresses rather than broad domain rules
- Regularly review and remove unused access

### 2. Monitor Access Patterns
- Review authentication logs weekly
- Set up alerts for failed authentication attempts
- Monitor for unusual upload patterns

### 3. Session Security
- Use reasonable session durations (24 hours max)
- Require fresh authentication for admin functions
- Consider requiring MFA for highly privileged users

### 4. Regular Audits
- Monthly review of authorized users
- Quarterly review of access policies
- Annual review of identity provider security

## Cost Considerations

**Cloudflare Zero Trust Pricing:**
- **Free Plan**: Up to 50 users, basic features
- **Standard Plan**: $7/user/month, advanced features
- **Enterprise**: Custom pricing, full feature set

**Recommendations:**
- Start with Free plan for small teams
- Upgrade to Standard if you need advanced policies or more users
- Enterprise for large organizations with complex requirements

---

## Summary

After completing this setup:

✅ **Upload Protection**: Only authorized users can upload files  
✅ **Public Downloads**: Download links work for anyone  
✅ **Bot Protection**: Turnstile still protects against bots  
✅ **Admin Security**: Database operations require authentication  
✅ **Audit Trail**: Complete logging of authentication events  
✅ **Scalable**: Easy to add/remove authorized users  

This configuration provides enterprise-grade security while maintaining the user-friendly download experience for file recipients.

For additional help, consult the [Cloudflare Zero Trust documentation](https://developers.cloudflare.com/cloudflare-one/) or create an issue in the project repository.