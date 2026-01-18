#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

let chokidar;
try {
  chokidar = require('chokidar');
} catch (error) {
  console.error('❌ chokidar not found. Installing...');
  console.error('   Run: npm install chokidar --save-dev');
  process.exit(1);
}

const projectRoot = path.join(__dirname, '..');
const updateScript = path.join(__dirname, 'update-version.js');

const watchPaths = {
  backend: path.join(projectRoot, 'backend', 'src'),
  auricapri: path.join(projectRoot, 'auricapri', 'src'),
  mobile: path.join(projectRoot, 'mobile', 'src'),
};

const ignoredPatterns = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /\.cache/,
  /\.vite/,
  /\.next/,
  /\.turbo/,
  /\.DS_Store/,
  /\.log$/,
];

let updateTimeouts = {};

function shouldIgnore(filePath) {
  return ignoredPatterns.some(pattern => pattern.test(filePath));
}

function updateVersionForApp(app) {
  if (updateTimeouts[app]) {
    clearTimeout(updateTimeouts[app]);
  }

  updateTimeouts[app] = setTimeout(() => {
    console.log(`\n📝 Detected changes in ${app}, updating version...`);
    exec(`node ${updateScript} --app=${app}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Failed to update version for ${app}:`, error.message);
        return;
      }
      if (stdout) {
        console.log(stdout.trim());
      }
    });
  }, 500);
}

function setupWatcher(app, watchPath) {
  if (!fs.existsSync(watchPath)) {
    console.warn(`⚠️  Watch path does not exist: ${watchPath}`);
    return;
  }

  const watcher = chokidar.watch(watchPath, {
    ignored: (filePath) => shouldIgnore(filePath),
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
  });

  watcher
    .on('add', (filePath) => {
      if (!shouldIgnore(filePath)) {
        updateVersionForApp(app);
      }
    })
    .on('change', (filePath) => {
      if (!shouldIgnore(filePath)) {
        updateVersionForApp(app);
      }
    })
    .on('unlink', (filePath) => {
      if (!shouldIgnore(filePath)) {
        updateVersionForApp(app);
      }
    })
    .on('error', (error) => {
      console.error(`❌ Watcher error for ${app}:`, error);
    });

  console.log(`👀 Watching ${app} at ${watchPath}`);
  return watcher;
}

console.log('🚀 Starting version watcher...\n');

const watchers = [];

Object.entries(watchPaths).forEach(([app, watchPath]) => {
  const watcher = setupWatcher(app, watchPath);
  if (watcher) {
    watchers.push({ app, watcher });
  }
});

if (watchers.length === 0) {
  console.error('❌ No valid watch paths found');
  process.exit(1);
}

console.log(`\n✅ Watching ${watchers.length} application(s)`);
console.log('   Press Ctrl+C to stop\n');

process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping watchers...');
  watchers.forEach(({ app, watcher }) => {
    watcher.close();
    console.log(`   Stopped watching ${app}`);
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  watchers.forEach(({ watcher }) => watcher.close());
  process.exit(0);
});
