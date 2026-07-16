// ============================================================
// Turns the single-file build (dist/index.html) into an
// artifact-ready fragment (dist/artifact.html):
//   - drops the <!doctype>/<html>/<head>/<body> wrapper tags
//     (the artifact host adds its own skeleton)
//   - removes the Google Fonts <link>s (blocked by the host's
//     security policy) and inlines the embedded fonts instead
// Run via: npm run build:artifact
// ============================================================
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
let html = await readFile(join(root, 'dist/index.html'), 'utf8')
const fonts = await readFile(join(root, 'scripts/artifact-fonts.css'), 'utf8')

html = html
  // strip document wrapper tags, keep everything inside them
  .replace(/<!doctype[^>]*>/i, '')
  .replace(/<\/?html[^>]*>/gi, '')
  .replace(/<\/?head[^>]*>/gi, '')
  .replace(/<\/?body[^>]*>/gi, '')
  // remove external font links + preconnects (offline page)
  .replace(/<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>/gi, '')
  // charset/viewport come from the host skeleton
  .replace(/<meta[^>]*charset[^>]*>/gi, '')
  .replace(/<meta[^>]*viewport[^>]*>/gi, '')

// Embedded fonts go first so every later style can use them.
html = `<style>\n${fonts}</style>\n${html.trim()}\n`

await writeFile(join(root, 'dist/artifact.html'), html)
console.log(`dist/artifact.html written (${(html.length / 1024 / 1024).toFixed(2)} MB)`)
