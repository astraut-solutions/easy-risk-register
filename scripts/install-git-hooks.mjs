import { chmodSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

function runGit(args) {
  return execFileSync('git', args, { stdio: 'inherit' });
}

runGit(['config', 'core.hooksPath', '.githooks']);

for (const hookPath of ['.githooks/pre-commit', '.githooks/pre-push']) {
  try {
    chmodSync(hookPath, 0o755);
  } catch {
    // On some platforms/filesystems this may fail; Git may still execute hooks.
  }
}

console.log('Git hooks installed (core.hooksPath = .githooks).');
console.log('Ensure gitleaks is installed locally: https://github.com/gitleaks/gitleaks#installation');

