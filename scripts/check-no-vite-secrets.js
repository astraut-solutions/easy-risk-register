/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

const SECRETISH = /(TOKEN|SECRET|PASSWORD|API_KEY|ACCESS_KEY|PRIVATE_KEY|CLIENT_SECRET)/i
const VITE_VAR = /^VITE_[A-Z0-9_]+$/i

const IGNORE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.vercel',
  '.npm-cache',
])

function walk(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue
      walk(path.join(dir, entry.name), results)
      continue
    }
    results.push(path.join(dir, entry.name))
  }
  return results
}

function checkEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/)
  const violations = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim()
    if (!line || line.startsWith('#')) continue

    const eq = line.indexOf('=')
    if (eq <= 0) continue

    const key = line.slice(0, eq).trim()
    if (!VITE_VAR.test(key)) continue
    if (!SECRETISH.test(key)) continue

    violations.push({ filePath, line: i + 1, key })
  }

  return violations
}

function checkSourceFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const violations = []

  const regex = /import\.meta\.env\.(VITE_[A-Z0-9_]+)/g
  let match
  while ((match = regex.exec(content)) !== null) {
    const key = match[1]
    if (!SECRETISH.test(key)) continue

    const prefix = content.slice(0, match.index)
    const line = prefix.split(/\r?\n/).length
    violations.push({ filePath, line, key })
  }

  return violations
}

function main() {
  const files = walk(ROOT)

  const envFiles = files.filter(f => path.basename(f).startsWith('.env'))
  const sourceFiles = files.filter(f => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f))

  const violations = []
  for (const f of envFiles) violations.push(...checkEnvFile(f))
  for (const f of sourceFiles) violations.push(...checkSourceFile(f))

  if (violations.length === 0) return

  console.error('Found secret-like Vite env variables. Do not ship secrets to the browser.')
  for (const v of violations) {
    console.error(`- ${path.relative(ROOT, v.filePath)}:${v.line} uses ${v.key}`)
  }

  process.exitCode = 1
}

main()

