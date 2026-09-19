import { spawnSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const port = process.env.PLAYWRIGHT_PORT || '3100';
const commands = [
  ['run', 'lint'],
  ['run', 'build'],
  ['exec', 'tsx', 'supabase/tests/validate_database.ts'],
  ['exec', 'playwright', 'test', 'tests/phaseB.spec.ts', 'tests/auth', 'tests/integrations', 'tests/security', 'tests/security.spec.ts'],
];

for (const args of commands) {
  console.log(`\n[release-gate] ${npmCommand} ${args.join(' ')}`);
  const result = spawnSync(npmCommand, args, {
    stdio: 'inherit',
    env: { ...process.env, PLAYWRIGHT_PORT: port },
    shell: process.platform === 'win32',
  });
  if (result.error) {
    console.error(`[release-gate] Failed to start command: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[release-gate] Failed: ${args.join(' ')}`);
    process.exit(result.status || 1);
  }
}

console.log('\n[release-gate] All release checks passed.');
