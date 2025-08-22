# 🔥 WAF Rule Deployment Guide

## 🎯 Problem Solved
Based on your WAF log, the issue is **"Inbound Anomaly Score Exceeded"** (Rule ID: `6179ae15870a4bb7b2d480d4843b323c`) from Cloudflare's Managed Ruleset `4814384a9e5d4991b9815dcfc25d2f1f`.

Large multipart file uploads trigger multiple anomaly detection rules, exceeding the threshold score of 56.

## 🚀 Quick Setup

### 1. Get Your Credentials
```bash
# Cloudflare Dashboard → My Profile → API Tokens → Global API Key
export CF_WAF_API_TOKEN="your_global_api_key_here"

# Cloudflare Dashboard → Your Domain → Overview → Zone ID (right sidebar)
export CF_WAF_ZONE_ID="your_zone_id_here"
```

### 2. Update wrangler.toml
Replace `YOUR_ZONE_ID_HERE` in `wrangler.toml` with your actual Zone ID.

### 3. Deploy WAF Rules
```bash
# Deploy WAF bypass rules
npm run deploy:waf

# Or deploy everything at once
npm run deploy:full
```

## 🛡️ WAF Rules Created

### Rule 1: Bypass Managed Challenge
- **Target:** `POST /api/transfer/upload*`
- **Action:** Skip managed challenge phase
- **Purpose:** Allow file uploads without CAPTCHA

### Rule 2: Skip Anomaly Detection  
- **Target:** Multipart form data uploads
- **Action:** Skip specific ruleset `4814384a9e5d4991b9815dcfc25d2f1f`
- **Purpose:** Prevent anomaly score from triggering on large files

### Rule 3: Allow API Endpoints
- **Target:** `/api/config`, `/api/transfer/(validate|info|download)`  
- **Action:** Skip managed challenge
- **Purpose:** Ensure all API calls work smoothly

## 🔍 Verification

After deployment:

1. **Check Dashboard:** Cloudflare → Security → WAF → Custom rules
2. **Test Upload:** Try uploading a file - should work without 403
3. **Monitor Events:** Security → Events → Check for bypassed requests

## 🆘 Troubleshooting

### If WAF deployment fails:
```bash
# Check API token permissions
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
     -H "Authorization: Bearer $CF_WAF_API_TOKEN"

# Verify Zone ID
curl -X GET "https://api.cloudflare.com/client/v4/zones/$CF_WAF_ZONE_ID" \
     -H "Authorization: Bearer $CF_WAF_API_TOKEN"
```

### Manual Alternative:
1. **Cloudflare Dashboard** → **Security** → **WAF** → **Custom rules**
2. **Create rule:**
   - **Name:** `TMC File Upload Bypass`
   - **Expression:** `(http.request.uri.path contains "/api/transfer/upload" and http.request.method eq "POST")`
   - **Action:** `Skip` → `All managed rules`

## 🎉 Expected Result

After WAF rules are deployed:
- ✅ File uploads work without 403 errors
- ✅ Turnstile validation still active for security
- ✅ Large multipart uploads succeed
- ✅ Normal security rules still protect other endpoints

The WAF rules specifically target the anomaly detection that was blocking your uploads while maintaining overall security!