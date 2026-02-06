#!/usr/bin/env node

/**
 * Database Migration Script
 * Automatically runs database migrations after deployment
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load environment variables from .env file
function loadEnv() {
  const envPath = join(projectRoot, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  }
}

// Load MIGRATION_AUTH_TOKEN from wrangler.toml if not in .env
function loadFromWranglerToml() {
  const tomlPath = join(projectRoot, 'wrangler.toml');
  if (fs.existsSync(tomlPath)) {
    const tomlContent = fs.readFileSync(tomlPath, 'utf8');
    const match = tomlContent.match(/MIGRATION_AUTH_TOKEN\s*=\s*"([^"]+)"/);
    if (match && !process.env.MIGRATION_AUTH_TOKEN) {
      process.env.MIGRATION_AUTH_TOKEN = match[1];
    }
  }
}

loadEnv();
loadFromWranglerToml();

// Configuration
const config = {
  production: {
    url: 'https://upload.frisson.social',
    authToken: process.env.MIGRATION_AUTH_TOKEN
  },
  preview: {
    url: process.env.CLOUDFLARE_PREVIEW_URL || 'https://your-preview-deployment.pages.dev',
    authToken: process.env.MIGRATION_AUTH_TOKEN
  }
};

async function runMigration(environment = 'production') {
  console.log(`🔄 Running database migration for ${environment} environment...`);
  
  const envConfig = config[environment];
  
  if (!envConfig.authToken) {
    console.error('❌ MIGRATION_AUTH_TOKEN environment variable is required');
    console.log('💡 Set it in your .env file or as an environment variable');
    process.exit(1);
  }

  const migrationUrl = `${envConfig.url}/api/db/migrate`;
  
  try {
    const response = await fetch(migrationUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${envConfig.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Database migration completed successfully');
      console.log(`📊 Timestamp: ${result.timestamp}`);
    } else {
      console.error('❌ Migration failed:', result.error || 'Unknown error');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Failed to run migration:', error.message);
    console.log('💡 Make sure your deployment is accessible and MIGRATION_AUTH_TOKEN is correct');
    process.exit(1);
  }
}

// Parse command line arguments
const environment = process.argv[2] || 'production';

if (!['production', 'preview'].includes(environment)) {
  console.error('❌ Environment must be "production" or "preview"');
  process.exit(1);
}

// Run migration
runMigration(environment).catch(console.error);