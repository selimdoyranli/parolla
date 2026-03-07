import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const distDir = join(__dirname, '../../dist')

const redirects = `
/.well-known/apple-app-site-association  /apple-app-site-association.json  200
/api/itunes/search  https://itunes.apple.com/search  200
`.trim()

const headers = `
/.well-known/apple-app-site-association
  Content-Type: application/json
/.well-known/apple-app-site-association.json
  Content-Type: application/json
`.trim()

writeFileSync(join(distDir, '_redirects'), redirects + '\n')
writeFileSync(join(distDir, '_headers'), headers + '\n')

console.log('✅ Cloudflare Pages redirects & headers generated successfully!')
