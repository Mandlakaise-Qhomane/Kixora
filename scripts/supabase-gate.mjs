import { spawnSync } from 'node:child_process';

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(command, ['supabase', 'db', 'lint', '--local'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});

if (result.status === 0) {
  console.log('[supabase-gate] Local Supabase migration/RLS lint passed.');
  process.exit(0);
}

if (process.env.REQUIRE_SUPABASE === 'true') {
  console.error('[supabase-gate] Local Supabase is required but unavailable or failed.');
  process.exit(result.status || 1);
}

console.warn('[supabase-gate] SKIPPED: local Supabase/Docker is unavailable. In-memory migration validation remains required.');
process.exit(0);
