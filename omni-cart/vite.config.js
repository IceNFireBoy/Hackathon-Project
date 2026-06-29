import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function readDotEnv() {
  const envPath = path.resolve(__dirname, '.env')
  const env = {}
  if (!fs.existsSync(envPath)) return env
  const content = fs.readFileSync(envPath, 'utf-8')
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eq = trimmed.indexOf('=')
    if (eq === -1) return
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  })
  return env
}

function substituteEnvInPublicHtml() {
  const env = readDotEnv()
  const replaceTokens = (content) =>
    content.replace(/%VITE_[A-Z0-9_]+%/g, (token) => env[token.slice(1, -1)] ?? '')

  return {
    name: 'substitute-env-in-public-html',
    apply: undefined,
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res, next) => {
          try {
            if (!req.url || req.method !== 'GET') return next()
            const urlPath = req.url.split('?')[0]
            if (!urlPath.endsWith('/sandbox.html') && urlPath !== 'sandbox.html') return next()
            const filePath = path.resolve(__dirname, 'public/sandbox.html')
            if (!fs.existsSync(filePath)) return next()
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(replaceTokens(fs.readFileSync(filePath, 'utf-8')))
          } catch (err) {
            console.error('[substitute-env] middleware error:', err)
            next()
          }
        })
      }
    },
    closeBundle() {
      const outPath = path.resolve(__dirname, 'dist/sandbox.html')
      if (!fs.existsSync(outPath)) return
      fs.writeFileSync(outPath, replaceTokens(fs.readFileSync(outPath, 'utf-8')))
    },
  }
}

export default defineConfig({
  plugins: [react(), substituteEnvInPublicHtml()],
})
