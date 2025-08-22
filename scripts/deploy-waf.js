#!/usr/bin/env node

/**
 * Deploy WAF rules for TMC File Transfer  
 * Run with: node scripts/deploy-waf.js
 */

import fs from 'fs';
import path from 'path';

// Try to load .env file if it exists
try {
  const envPath = path.join(process.cwd(), '.env');
  
  console.log(`🔍 Looking for .env at: ${envPath}`);
  
  if (fs.existsSync(envPath)) {
    console.log('📁 Found .env file, loading...');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach((line, index) => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const equalIndex = line.indexOf('=');
        if (equalIndex > 0) {
          const key = line.substring(0, equalIndex).trim();
          const value = line.substring(equalIndex + 1).trim().replace(/^["']|["']$/g, '');
          
          if (key && value) {
            process.env[key] = value;
            console.log(`   ✅ Loaded ${key}=${value.substring(0, 10)}...`);
          }
        }
      }
    });
  } else {
    console.log('❌ No .env file found');
  }
} catch (error) {
  console.error('⚠️  Error loading .env:', error.message);
}

const CLOUDFLARE_API_TOKEN = process.env.CF_WAF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
const ZONE_ID = process.env.CF_WAF_ZONE_ID || process.env.CLOUDFLARE_ZONE_ID || 'REDACTED_ZONE_ID';
const DOMAIN = 'upload.frisson.social';

console.log('🔧 Environment Variables:');
console.log(`   CF_WAF_API_TOKEN: ${CLOUDFLARE_API_TOKEN ? CLOUDFLARE_API_TOKEN.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`   CF_WAF_ZONE_ID: ${ZONE_ID}`);
console.log('');

if (!CLOUDFLARE_API_TOKEN || !ZONE_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   CF_WAF_API_TOKEN - Your Cloudflare API token');
  console.error('   CF_WAF_ZONE_ID - Your zone ID');
  console.error('');
  console.error('💡 Solutions:');
  console.error('   1. Create .env file with: CF_WAF_API_TOKEN=your_token_here');
  console.error('   2. Or set environment variable: $env:CF_WAF_API_TOKEN="your_token"');
  process.exit(1);
}

const wafRules = [
  {
    description: "TMC File Transfer - Bypass managed challenge for uploads",
    expression: `(http.host eq "${DOMAIN}" and http.request.uri.path contains "/api/transfer/upload" and http.request.method eq "POST")`,
    action: "skip",
    action_parameters: {
      phases: ["http_request_firewall_managed"]
    },
    enabled: true
  },
  {
    description: "TMC File Transfer - Skip anomaly detection for multipart uploads", 
    expression: `(http.host eq "${DOMAIN}" and http.request.uri.path contains "/api/transfer/upload" and http.request.method eq "POST" and any(http.request.headers["content-type"][*] contains "multipart/form-data"))`,
    action: "skip",
    action_parameters: {
      phases: ["http_request_firewall_managed"]
    },
    enabled: true
  },
  {
    description: "TMC File Transfer - Allow config endpoint",
    expression: `(http.host eq "${DOMAIN}" and http.request.uri.path contains "/api/config")`,
    action: "skip", 
    action_parameters: {
      phases: ["http_request_firewall_managed"]
    },
    enabled: true
  },
  {
    description: "TMC File Transfer - Allow transfer endpoints",
    expression: `(http.host eq "${DOMAIN}" and (http.request.uri.path contains "/api/transfer/validate" or http.request.uri.path contains "/api/transfer/info" or http.request.uri.path contains "/api/transfer/download"))`,
    action: "skip", 
    action_parameters: {
      phases: ["http_request_firewall_managed"]
    },
    enabled: true
  }
];

async function deployWAFRules() {
  console.log('🚀 Deploying WAF rules...');

  try {
    // First, try to get existing custom ruleset
    let rulesetId = null;
    const getRuleset = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rulesets/phases/http_request_firewall_custom/entrypoint`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    const getRulesetResult = await getRuleset.json();
    
    if (getRulesetResult.success && getRulesetResult.result) {
      rulesetId = getRulesetResult.result.id;
      console.log(`📋 Found existing ruleset: ${rulesetId}`);
    }

    // Create or update ruleset with our rules
    const method = rulesetId ? 'PUT' : 'POST';
    const url = rulesetId 
      ? `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rulesets/${rulesetId}`
      : `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rulesets`;

    // If updating existing ruleset, preserve the existing name
    const rulesetData = rulesetId ? {
      description: "Custom WAF rules for TMC File Transfer application", 
      rules: wafRules
    } : {
      name: "TMC File Transfer WAF Rules",
      description: "Custom WAF rules for TMC File Transfer application",
      kind: "zone",
      phase: "http_request_firewall_custom",
      rules: wafRules
    };

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rulesetData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Ruleset ${method === 'POST' ? 'created' : 'updated'} successfully`);
      console.log(`📋 Ruleset ID: ${result.result.id}`);
      result.result.rules.forEach((rule, index) => {
        console.log(`   ${index + 1}. ${rule.description}`);
      });
    } else {
      console.error('❌ Failed to deploy ruleset');
      console.error('Response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

console.log('🔧 TMC File Transfer - WAF Rule Deployment');
console.log(`📡 Domain: ${DOMAIN}`);
console.log(`🆔 Zone ID: ${ZONE_ID}`);
console.log('');

deployWAFRules().then(() => {
  console.log('');
  console.log('✅ WAF rule deployment complete!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Check Cloudflare Dashboard → Security → WAF');
  console.log('2. Test file uploads');
  console.log('3. Monitor WAF events for effectiveness');
}).catch(error => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});