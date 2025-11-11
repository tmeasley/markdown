#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();

const requiredFiles = [
  'assets/icon.png',
  'assets/icon.ico',
  'vendor/marked/marked.js',
  'vendor/fontawesome/fontawesome.css',
  'vendor/fontawesome/webfonts/fa-solid-900.woff2'
];

const missing = requiredFiles.filter((relative) => {
  const absolute = path.join(root, relative);
  return !fs.existsSync(absolute);
});

if (missing.length) {
  console.error('Smoke test failed. Missing files:\n', missing.join('\n'));
  process.exit(1);
}

const pkg = require(path.join(root, 'package.json'));
const requiredFields = ['name', 'description', 'author'];
const missingFields = requiredFields.filter((key) => !pkg[key] || pkg[key].trim() === '');

if (missingFields.length) {
  console.error('Smoke test failed. Missing package.json fields:', missingFields.join(', '));
  process.exit(1);
}

console.log('Smoke test passed. Required assets and metadata are present.');
