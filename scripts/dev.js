#!/usr/bin/env node
import { spawn } from 'child_process';
import process from 'process';

console.log('\x1b[36m%s\x1b[0m', '🚀 Starting ARCA dev environment (Backend Server + Vite Client)...');

const isWindows = process.platform === 'win32';

// 1. Spawn backend server
const serverProcess = spawn('node', ['server/index.js'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: isWindows,
  env: { ...process.env, FORCE_COLOR: '1' },
});

// 2. Spawn frontend Vite
const clientProcess = spawn('npx', ['vite'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: isWindows,
  env: { ...process.env, FORCE_COLOR: '1' },
});

// Helper for formatted prefix output
function pipeOutput(child, prefix, colorCode) {
  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim().length > 0) {
        console.log(`\x1b[${colorCode}m[${prefix}]\x1b[0m ${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim().length > 0) {
        console.error(`\x1b[${colorCode}m[${prefix}]\x1b[0m \x1b[31m${line}\x1b[0m`);
      }
    });
  });
}

pipeOutput(serverProcess, 'server', '34'); // Blue for server
pipeOutput(clientProcess, 'client', '32'); // Green for client

let isShuttingDown = false;
function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\n\x1b[33m%s\x1b[0m', 'Shutting down dev processes...');

  try {
    serverProcess.kill('SIGTERM');
  } catch {
    // ignore
  }

  try {
    clientProcess.kill('SIGTERM');
  } catch {
    // ignore
  }

  setTimeout(() => process.exit(code), 500);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

serverProcess.on('exit', (code) => {
  if (!isShuttingDown) {
    console.warn(`[server] exited with code ${code}`);
    shutdown(code || 0);
  }
});

clientProcess.on('exit', (code) => {
  if (!isShuttingDown) {
    console.warn(`[client] exited with code ${code}`);
    shutdown(code || 0);
  }
});
