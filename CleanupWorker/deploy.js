#!/usr/bin/env node

/**
 * Cleanup Worker Deployment Script
 * Uses the main wrangler.toml configuration to deploy the cleanup worker
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const environment = process.argv[2] || 'production';
const validEnvs = ['production', 'preview'];

if (!validEnvs.includes(environment)) {
  console.error(`❌ Invalid environment: ${environment}`);
  console.error(`   Valid environments: ${validEnvs.join(', ')}`);
  process.exit(1);
}

// Read configuration from main wrangler.toml
const mainWranglerPath = path.join(__dirname, '..', 'wrangler.toml');
const mainConfig = fs.readFileSync(mainWranglerPath, 'utf8');

// Extract relevant configuration
const getConfigValue = (section, key) => {
  const regex = new RegExp(`\\[env\\.${environment}\\.${section}\\]([\\s\\S]*?)(?=\\[|$)`);
  const sectionMatch = mainConfig.match(regex);
  if (!sectionMatch) return null;
  
  const keyRegex = new RegExp(`${key}\\s*=\\s*"([^"]*)"`, 'i');
  const keyMatch = sectionMatch[1].match(keyRegex);
  return keyMatch ? keyMatch[1] : null;
};

// Get database and R2 configuration
const getDatabaseConfig = () => {
  const dbRegex = new RegExp(`\\[\\[env\\.${environment}\\.d1_databases\\]\\]([\\s\\S]*?)(?=\\[\\[|\\[env|$)`);
  const match = mainConfig.match(dbRegex);
  if (!match) return null;
  
  const binding = match[1].match(/binding\s*=\s*"([^"]*)"/)?.[1];
  const database_name = match[1].match(/database_name\s*=\s*"([^"]*)"/)?.[1];
  const database_id = match[1].match(/database_id\s*=\s*"([^"]*)"/)?.[1];
  
  return { binding, database_name, database_id };
};

const getR2Config = () => {
  const r2Regex = new RegExp(`\\[\\[env\\.${environment}\\.r2_buckets\\]\\]([\\s\\S]*?)(?=\\[\\[|\\[env|$)`);
  const match = mainConfig.match(r2Regex);
  if (!match) return null;
  
  const binding = match[1].match(/binding\s*=\s*"([^"]*)"/)?.[1];
  const bucket_name = match[1].match(/bucket_name\s*=\s*"([^"]*)"/)?.[1];
  
  return { binding, bucket_name };
};

// Create temporary wrangler.toml for cleanup worker
const dbConfig = getDatabaseConfig();
const r2Config = getR2Config();

if (!dbConfig || !r2Config) {
  console.error('❌ Could not find database or R2 configuration in main wrangler.toml');
  process.exit(1);
}

const cleanupWranglerConfig = `
name = "tmc-file-transfer-cleanup${environment === 'preview' ? '-preview' : ''}"
main = "src/index-improved.js"
compatibility_date = "2024-08-21"

[vars]
ENVIRONMENT = "${environment}"
CLEANUP_SECRET = "${environment === 'production' ? 'your-production-cleanup-secret' : 'your-preview-cleanup-secret'}"

[[d1_databases]]
binding = "${dbConfig.binding}"
database_name = "${dbConfig.database_name}"
database_id = "${dbConfig.database_id}"

[[r2_buckets]]
binding = "${r2Config.binding}"
bucket_name = "${r2Config.bucket_name}"

[triggers]
crons = ["${environment === 'production' ? '0 0 * * *' : '0 2 * * *'}"]
`;

const tempWranglerPath = path.join(__dirname, 'wrangler.temp.toml');
fs.writeFileSync(tempWranglerPath, cleanupWranglerConfig);

try {
  console.log(`🚀 Deploying cleanup worker to ${environment}...`);
  console.log(`📝 Using configuration from main wrangler.toml`);
  console.log(`⏰ Schedule: ${environment === 'production' ? 'Daily at midnight' : 'Daily at 2 AM'}`);
  
  const deployCommand = `wrangler deploy --config wrangler.temp.toml`;
  console.log(`🔧 Running: ${deployCommand}`);
  
  execSync(deployCommand, { 
    cwd: __dirname, 
    stdio: 'inherit' 
  });
  
  console.log(`✅ Cleanup worker deployed successfully to ${environment}!`);
  
} catch (error) {
  console.error(`❌ Deployment failed:`, error.message);
  process.exit(1);
} finally {
  // Clean up temporary file
  if (fs.existsSync(tempWranglerPath)) {
    fs.unlinkSync(tempWranglerPath);
  }
}