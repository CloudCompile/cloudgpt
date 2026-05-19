#!/usr/bin/env node
'use strict';

// Pterodactyl entry point — builds Next.js then starts the standalone server.
// The egg runs: node /home/container/server.js

const { execSync, spawn } = require('child_process');

const cwd = '/home/container';

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd });
}

console.log('==> Building Next.js...');
run('npm run build');

// Next.js standalone needs these copied in manually
run('cp -r public .next/standalone/public');
run('cp -r .next/static .next/standalone/.next/static');

console.log(`==> Starting on port ${process.env.PORT || 3000}`);

const child = spawn(process.execPath, ['.next/standalone/server.js'], {
  stdio: 'inherit',
  cwd,
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGTERM', () => child.kill('SIGTERM'));
process.on('SIGINT', () => child.kill('SIGINT'));
