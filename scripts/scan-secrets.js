#!/usr/bin/env node

/**
 * Stacked Budgeting - Automated Pre-Commit Secret Scanner
 * 
 * Scans git staged changes or repository files for leaked secrets:
 * - Google Cloud / Firebase API Keys
 * - Gemini API Keys
 * - OpenAI API Keys
 * - Anthropic API Keys
 * - ElevenLabs API Keys
 * - AWS Credentials
 * - Private Keys
 * - Local environment files (.env*)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Known benign placeholder patterns that should NOT trigger warnings
const ALLOWED_PLACEHOLDERS = [
  'your_api_key',
  'your_firebase_api_key',
  'your_gemini_api_key',
  'your_gemini_stt_api_key',
  'your_elevenlabs_api_key',
  'your_elevenlabs_agent_id',
  'your_openai_api_key',
  'your_anthropic_api_key',
  'your_project_id',
  'your_messaging_sender_id',
  'your_app_id',
  'your_measurement_id',
  'your-api-id',
  'your-ws-id',
];

const SECRET_PATTERNS = [
  {
    name: 'Google / Firebase / Gemini API Key',
    regex: /AIzaSy[A-Za-z0-9_-]{20,45}/g,
  },
  {
    name: 'OpenAI API Key',
    regex: /sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{16,}/g,
  },
  {
    name: 'Anthropic API Key',
    regex: /sk-ant-[A-Za-z0-9_-]{16,}/g,
  },
  {
    name: 'AWS Access Key ID',
    regex: /(?:^|[^A-Z0-9])(AKIA[0-9A-Z]{16})(?:[^A-Z0-9]|$)/g,
  },
  {
    name: 'ElevenLabs API Key Header',
    regex: /(?:xi-api-key|elevenlabs[_-]?api[_-]?key)\s*[:=]\s*['"]([a-zA-Z0-9_-]{16,})['"]/gi,
  },
  {
    name: 'Named API Key / Token String Literal',
    regex: /(?:GEMINI|OPENAI|ANTHROPIC|ELEVENLABS|FIREBASE|RECEIPT|ASSISTANT)_(?:API_)?KEY\s*[:=]\s*['"]([a-zA-Z0-9_\-]{16,})['"]/gi,
  },
  {
    name: 'Private Key Block',
    regex: /-----BEGIN (?:RSA|OPENSSH|EC|DSA|PGP|PRIVATE) KEY-----/g,
  },
  {
    name: 'Hardcoded Secret Assignment',
    regex: /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"]([a-zA-Z0-9_\-]{16,})['"]/gi,
  },
];

// Files to always ignore (e.g., scanners, documentation templates, lock files)
const IGNORED_FILES = [
  'scripts/scan-secrets.js',
  'scripts/verify-secrets.sh',
  '.env.example',
  'package-lock.json',
];

function isStagedMode() {
  return process.argv.includes('--staged') || !process.argv.includes('--all');
}

function scanStagedDiff() {
  const violations = [];

  try {
    // 1. Check for staged .env files
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);

    for (const file of stagedFiles) {
      const basename = path.basename(file);
      if ((basename.startsWith('.env') && basename !== '.env.example') || basename.endsWith('.env')) {
        violations.push({
          file,
          line: 1,
          rule: 'Environment File Staged',
          snippet: `Attempted to commit sensitive environment file: ${file}`,
        });
      }
    }

    // 2. Check staged content additions
    const diff = execSync('git diff --cached -U0', { encoding: 'utf-8' });
    const lines = diff.split('\n');
    let currentFile = '';
    let currentLine = 0;

    for (const line of lines) {
      if (line.startsWith('+++ b/')) {
        currentFile = line.substring(6).trim();
        continue;
      }

      if (line.startsWith('@@ ')) {
        const match = line.match(/\+([0-9]+)/);
        if (match) {
          currentLine = parseInt(match[1], 10);
        }
        continue;
      }

      // Only check added lines (+)
      if (line.startsWith('+') && !line.startsWith('+++')) {
        const addedContent = line.substring(1);

        if (IGNORED_FILES.some(ignored => currentFile.endsWith(ignored))) {
          continue;
        }

        // Check if line contains allowed placeholders
        const hasPlaceholder = ALLOWED_PLACEHOLDERS.some(placeholder => 
          addedContent.includes(placeholder)
        );
        if (hasPlaceholder) {
          continue;
        }

        for (const pattern of SECRET_PATTERNS) {
          pattern.regex.lastIndex = 0;
          const match = pattern.regex.exec(addedContent);
          if (match) {
            violations.push({
              file: currentFile,
              line: currentLine,
              rule: pattern.name,
              snippet: line.trim().substring(0, 100),
            });
            break;
          }
        }
        currentLine++;
      }
    }
  } catch (err) {
    console.error('Warning: Unable to execute git diff check:', err.message);
  }

  return violations;
}

function scanAllFiles() {
  const violations = [];
  const rootDir = process.cwd();

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(rootDir, fullPath);

      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'dist' ||
        entry.name === 'build' ||
        IGNORED_FILES.some(ignored => relPath.endsWith(ignored))
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const basename = entry.name;
        if ((basename.startsWith('.env') && basename !== '.env.example') || basename.endsWith('.env')) {
          violations.push({
            file: relPath,
            line: 1,
            rule: 'Untracked / Tracked Environment File',
            snippet: relPath,
          });
        }

        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const hasPlaceholder = ALLOWED_PLACEHOLDERS.some(placeholder => line.includes(placeholder));
            if (hasPlaceholder) continue;

            for (const pattern of SECRET_PATTERNS) {
              pattern.regex.lastIndex = 0;
              if (pattern.regex.test(line)) {
                violations.push({
                  file: relPath,
                  line: i + 1,
                  rule: pattern.name,
                  snippet: line.trim().substring(0, 100),
                });
                break;
              }
            }
          }
        } catch {
          // Ignore binary files
        }
      }
    }
  }

  walk(rootDir);
  return violations;
}

function main() {
  const isStaged = isStagedMode();
  const violations = isStaged ? scanStagedDiff() : scanAllFiles();

  if (violations.length > 0) {
    console.error('\n╔══════════════════════════════════════════════════════════════════════════════╗');
    console.error('║                     🚨 SECURITY SCANNER: SECRETS DETECTED!                    ║');
    console.error('╚══════════════════════════════════════════════════════════════════════════════╝\n');
    console.error('Commit BLOCKED. Potential sensitive keys or credentials detected:\n');

    for (const v of violations) {
      console.error(`  ❌ [${v.rule}]`);
      console.error(`     File: ${v.file}:${v.line}`);
      console.error(`     Snippet: ${v.snippet}`);
      console.error('');
    }

    console.error('────────────────────────────────────────────────────────────────────────────────');
    console.error('Remediation:');
    console.error('  1. Remove hardcoded API keys and secrets from the code.');
    console.error('  2. Move keys to your local .env file (which is in .gitignore).');
    console.error('  3. In production, configure keys in the Vercel Dashboard Environment Variables.');
    console.error('  4. If this is a false positive, verify against ALLOWED_PLACEHOLDERS in scripts/scan-secrets.js.');
    console.error('────────────────────────────────────────────────────────────────────────────────\n');
    process.exit(1);
  }

  if (isStaged) {
    console.log('✅ Pre-commit security check: No secrets detected in staged changes.');
  } else {
    console.log('✅ Full codebase security check: No secrets detected.');
  }
  process.exit(0);
}

main();
