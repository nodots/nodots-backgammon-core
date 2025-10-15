// Build without npm by invoking the local TypeScript compiler.
// Usage: from packages/core, run: node scripts/run-build.js [tsc args]
const { spawnSync } = require('node:child_process')
const path = require('node:path')

function run() {
  const tscPath = path.join(__dirname, '..', 'node_modules', 'typescript', 'bin', 'tsc')
  const args = process.argv.slice(2)
  const result = spawnSync(process.execPath, [tscPath, ...args], {
    stdio: 'inherit',
    env: { ...process.env, NODE_OPTIONS: '' },
  })
  process.exit(result.status ?? 1)
}

run()

