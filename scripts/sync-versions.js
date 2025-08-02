const fs = require('fs');
const path = require('path');

// Read the main package.json version
const mainPackagePath = path.join(__dirname, '..', 'package.json');
const mainPackage = JSON.parse(fs.readFileSync(mainPackagePath, 'utf8'));
const newVersion = mainPackage.version;

console.log(`🔄 Syncing version ${newVersion} across all packages...`);

// Update frontend package.json
const frontendPackagePath = path.join(__dirname, '..', 'frontend', 'package.json');
if (fs.existsSync(frontendPackagePath)) {
  const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
  frontendPackage.version = newVersion;
  fs.writeFileSync(frontendPackagePath, JSON.stringify(frontendPackage, null, 2) + '\n');
  console.log(`✅ Frontend version updated to ${newVersion}`);
}

// Update backend package.json
const backendPackagePath = path.join(__dirname, '..', 'backend', 'package.json');
if (fs.existsSync(backendPackagePath)) {
  const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
  backendPackage.version = newVersion;
  fs.writeFileSync(backendPackagePath, JSON.stringify(backendPackage, null, 2) + '\n');
  console.log(`✅ Backend version updated to ${newVersion}`);
}

// Create version.json files for easy access
const versionData = {
  version: newVersion,
  buildDate: new Date().toISOString(),
  commitHash: process.env.GIT_COMMIT_HASH || 'unknown',
  environment: process.env.NODE_ENV || 'development'
};

// Frontend version file
const frontendVersionPath = path.join(__dirname, '..', 'frontend', 'public', 'version.json');
fs.writeFileSync(frontendVersionPath, JSON.stringify(versionData, null, 2));
console.log(`✅ Frontend version.json created`);

// Backend version file
const backendVersionPath = path.join(__dirname, '..', 'backend', 'src', 'version.json');
fs.writeFileSync(backendVersionPath, JSON.stringify(versionData, null, 2));
console.log(`✅ Backend version.json created`);

console.log(`🎉 Version sync completed! All packages now use version ${newVersion}`); 