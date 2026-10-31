import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const distDir = join(__dirname, '../../dist')

const redirects = `
/.well-known/apple-app-site-association  /apple-app-site-association.json  200
/profil/:username/degerlendirmeler  /profil/:username/yorumlar  301
/en/profile/:username/reviews  /en/profile/:username/comments  301
/altin-gecmisi  /aktiviteler/altin-gecmisi  301
/en/gold-history  /en/activities/gold-history  301
/muzik  /muzik/sarki-tahmin-et/  301
/muzik/  /muzik/sarki-tahmin-et/  301
/en/music  /en/music/guess-the-song/  301
/en/music/  /en/music/guess-the-song/  301
/party  /parti/  301
/party/*  /parti/:splat  301
/en/parti  /en/party/  301
/en/parti/*  /en/party/:splat  301
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
