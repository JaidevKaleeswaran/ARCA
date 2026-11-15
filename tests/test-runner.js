#!/usr/bin/env node
import { spawn } from 'child_process';
import process from 'process';

console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════════════');
console.log('\x1b[36m%s\x1b[0m', '   ARCA — Comprehensive Full-Stack & E2E Testing Suite Runner         ');
console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════════════\n');

const isAll = process.argv.includes('--all');
const isApiOnly = process.argv.includes('--api');
const isE2EOnly = process.argv.includes('--e2e');

function runCommand(command, args, label) {
  return new Promise((resolve) => {
    console.log(`\x1b[33m▶ Running [${label}]:\x1b[0m ${command} ${args.join(' ')}\n`);
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n\x1b[32m✔ [${label}] Passed successfully.\x1b[0m\n`);
        resolve(true);
      } else {
        console.error(`\n\x1b[31m✖ [${label}] Failed with exit code ${code}.\x1b[0m\n`);
        resolve(false);
      }
    });
  });
}

async function main() {
  const startTime = Date.now();
  const results = {};

  if (!isE2EOnly) {
    // 1. Vitest Backend API, Agents, MCP & Security Suites
    results['Backend API & Integration Tests'] = await runCommand(
      'npx',
      ['vitest', 'run', 'tests/api', 'tests/agents', 'tests/mcp', 'tests/security'],
      'Backend Vitest Suites'
    );

    // 2. Deterministic Quotas & Monday UTC Reset Engine
    results['Quotas & MCP Registration Engine'] = await runCommand(
      'node',
      ['server/tests/test-ai-mcp-quotas.js'],
      'Quotas & In-Process MCP Engine'
    );
  }

  if (isAll || isE2EOnly) {
    // 3. Playwright End-to-End Browser Automation Across All Tabs
    results['Playwright E2E UI Suite (All Tabs & Modals)'] = await runCommand(
      'npx',
      ['playwright', 'test'],
      'Playwright Chromium E2E'
    );
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n\x1b[36m═══════════════════════════════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[36m   TEST EXECUTION SUMMARY DASHBOARD                                    \x1b[0m');
  console.log('\x1b[36m═══════════════════════════════════════════════════════════════════════\x1b[0m');

  let allPassed = true;
  for (const [suite, passed] of Object.entries(results)) {
    const icon = passed ? '\x1b[32m✔ PASS\x1b[0m' : '\x1b[31m✖ FAIL\x1b[0m';
    console.log(`  ${icon}  ${suite}`);
    if (!passed) allPassed = false;
  }

  console.log(`\nTotal Duration: ${durationSec}s`);
  if (allPassed) {
    console.log('\x1b[32m%s\x1b[0m', 'All test suites completed successfully with 100% pass rate! 🎉\n');
    process.exit(0);
  } else {
    console.error('\x1b[31m%s\x1b[0m', 'One or more test suites failed. Please review the logs above.\n');
    process.exit(1);
  }
}

main();
