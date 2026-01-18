#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}${month}${day}-${hours}${minutes}`;
}

function updateVersion(app) {
  const version = getTimestamp();
  const versionFile = path.join(__dirname, '..', app, 'VERSION');
  
  try {
    fs.writeFileSync(versionFile, version + '\n', 'utf8');
    console.log(`✅ Updated ${app}/VERSION to ${version}`);
    
    if (app === 'auricapri') {
      const publicVersionFile = path.join(__dirname, '..', app, 'public', 'VERSION');
      fs.writeFileSync(publicVersionFile, version + '\n', 'utf8');
      console.log(`✅ Updated ${app}/public/VERSION to ${version}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to update ${app}/VERSION:`, error.message);
    return false;
  }
}

const args = process.argv.slice(2);
const allFlag = args.includes('--all');

if (allFlag) {
  const apps = ['backend', 'auricapri', 'mobile'];
  let successCount = 0;
  
  apps.forEach(app => {
    if (updateVersion(app)) {
      successCount++;
    }
  });
  
  console.log(`\n📦 Updated ${successCount}/${apps.length} versions`);
  process.exit(successCount === apps.length ? 0 : 1);
} else {
  const appArg = args.find(arg => arg.startsWith('--app='));
  const app = appArg ? appArg.split('=')[1] : null;
  
  if (!app) {
    console.error('❌ Usage: node update-version.js [--app=<app>] [--all]');
    console.error('   Apps: backend, auricapri, mobile');
    process.exit(1);
  }
  
  const validApps = ['backend', 'auricapri', 'mobile'];
  if (!validApps.includes(app)) {
    console.error(`❌ Invalid app: ${app}`);
    console.error('   Valid apps: backend, auricapri, mobile');
    process.exit(1);
  }
  
  const success = updateVersion(app);
  process.exit(success ? 0 : 1);
}
