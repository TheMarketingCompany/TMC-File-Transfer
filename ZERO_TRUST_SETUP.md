# 🔐 Cloudflare Zero Trust Setup Guide

This guide will help you configure Cloudflare Zero Trust to restrict file uploads to authorized users while keeping downloads public for everyone.

## Overview

After implementing Zero Trust:
- ✅ **Frontend Authentication**: Users authenticate in the frontend before accessing upload features
- ✅ **Downloads**: Anyone with the link can download files (remains public)  
- ✅ **Seamless Integration**: Works with existing Turnstile bot protection
- ✅ **No API Blocking**: Backend APIs remain accessible, authentication is handled in frontend

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

**Option A: Google OAuth (Recommended)**
1. Go to **Settings > Authentication** 
2. Click **Add new** identity provider
3. Select **Google**
4. Follow the OAuth setup instructions
5. Configure allowed Google domains/users

**Option B: Email OTP**
1. Go to **Settings > Authentication**
2. Click **Add new** identity provider
3. Select **One-time PIN**
4. Configure email domains you want to allow
5. Save configuration

**Option C: Microsoft Azure AD**
1. Go to **Settings > Authentication**
2. Click **Add new** identity provider  
3. Select **Azure AD**
4. Configure with your Azure tenant information

## Step 2: Create Zero Trust Application for Frontend

### 2.1 Create Application for Upload Authentication

1. **Go to Access > Applications**
2. **Click "Add an application"**
3. **Select "Self-hosted"**
4. **Configure Application:**

```
Application name: TMC File Transfer - Upload Auth
Session Duration: 24 hours
Application domain: your-domain.pages.dev
```

### 2.2 Configure Protected Paths

**IMPORTANT:** Only protect the upload page, keep everything else public!

**Protected paths:**
```
Path: /upload*
```

**DO NOT protect these paths:**
- `/api/*` - Keep all APIs public  
- `/` - Keep main app public
- `/dl/*` - Keep downloads public
- All other pages and static assets remain public

### 2.3 Create Access Policies

**Policy: Upload Access for Authorized Users**

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

## Step 3: Frontend Integration

### 3.1 Update Upload Page for Zero Trust Integration

Since `/upload` is now protected by Zero Trust, the authentication happens automatically. Update your upload page (`src/components/UploadPageNew.vue`) to get user info:

```vue
<template>
  <div class="min-h-screen md-expressive-surface flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-8 md-expressive-fade-in">
        <h1 class="md-expressive-headline mb-4">File Transfer</h1>
        <p class="md-expressive-body">Share files quickly and securely</p>
        
        <!-- User info and sign out -->
        <div v-if="userEmail" class="mt-4 p-4 rounded-2xl" style="background-color: var(--md-sys-color-surface-container-low);">
          <p class="text-sm" style="color: var(--md-sys-color-on-surface-variant);">
            ✅ Authenticated as: <strong>{{ userEmail }}</strong>
            <md-text-button @click="signOut" class="ml-4" style="--md-text-button-label-text-color: var(--md-sys-color-primary);">
              <md-icon slot="icon">logout</md-icon>
              Sign Out
            </md-text-button>
          </p>
        </div>
      </div>

      <!-- Your existing upload form goes here -->
      <!-- ... rest of your upload interface ... -->
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// User information
const userEmail = ref('');

// Get user information from Zero Trust
async function getUserInfo() {
  try {
    const response = await fetch('/cdn-cgi/access/get-identity', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const userData = await response.json();
      userEmail.value = userData.email || 'Unknown User';
      console.log('Authenticated user:', userData.email);
    }
  } catch (error) {
    console.log('Could not get user info:', error);
    userEmail.value = 'Unknown User';
  }
}

// Sign out
function signOut() {
  // Redirect to Zero Trust logout
  window.location.href = '/cdn-cgi/access/logout';
}

// Get user info on component mount
onMounted(() => {
  getUserInfo();
});

// Your existing upload logic...
</script>
```

### 3.2 Configure Upload Page Routing

Update your Vue router to handle authentication checks. In `src/router.ts`:

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import UploadPageNew from './components/UploadPageNew.vue'
// ... other imports

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/upload',
      name: 'Upload',
      component: UploadPageNew,
      beforeEnter: async (to, from, next) => {
        // Optional: Pre-check authentication status
        // This is handled in the component itself
        next()
      }
    },
    // ... other routes
  ]
})

export default router
```

### 3.3 Optional: User Information in API (Advanced)

If you want to log which user uploaded files, you can pass user info from frontend:

```typescript
// In your upload function
async function uploadFile() {
  // Get user info if authenticated
  let userInfo = null;
  if (isAuthenticated.value) {
    userInfo = await getUserInfo();
  }
  
  const uploadOptions = {
    ...options,
    turnstileToken: turnstileToken.value,
    userEmail: userInfo?.email // Add user email to upload metadata
  };
  
  const result = await ApiClient.uploadFile(selectedFile.value, uploadOptions, onProgress);
  // ... rest of upload logic
}
```

## Step 4: Test Zero Trust Configuration

### 4.1 Test Upload Authentication

1. **Open your site in incognito/private browser**
2. **Go to `/upload`**
3. **Should automatically redirect to Zero Trust authentication**
4. **Complete authentication with authorized email**
5. **Should return to upload page showing your email and upload interface**
6. **Try uploading a file - should work normally**

### 4.2 Test Download Access (Should Remain Public)

1. **Get a file download link**
2. **Open in incognito/private browser** 
3. **Download should work without authentication**
4. **No authentication prompts should appear**

### 4.3 Test Different User Types

**Test authorized user:**
1. Go to upload page
2. Click "Sign In"
3. Use authorized email address
4. Should successfully authenticate and see upload interface

**Test unauthorized user:**
1. Go to upload page  
2. Click "Sign In"
3. Try using non-authorized email
4. Should be blocked with "Access Denied" message

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