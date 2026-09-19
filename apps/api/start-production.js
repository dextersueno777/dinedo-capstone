const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const candidates = [
  'dist/main.js',
  'dist/src/main.js',
  '../../dist/main.js',
  '../../dist/src/main.js',
  '../../dist/apps/api/main.js',
  '../../dist/apps/api/src/main.js',
];

const entry = candidates
  .map((candidate) => resolve(__dirname, candidate))
  .find((candidate) => existsSync(candidate));

if (!entry) {
  console.error('Could not find built NestJS entry file.');
  console.error('Checked paths:');
  for (const candidate of candidates) {
    console.error('-', resolve(__dirname, candidate));
  }
  process.exit(1);
}

console.log('Starting API from:', entry);

const result = spawnSync(process.execPath, [entry], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
