// Write the same React UI players see into the HTML served by static hosting.
import { readFile, writeFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import { createServer } from 'vite'

const entry = new URL('../dist/index.html', import.meta.url)
const html = await readFile(entry, 'utf8')
const marker = '<!--app-html-->'
if (!html.includes(marker)) throw new Error('게임 화면을 넣을 HTML 위치를 찾을 수 없습니다.')

const vite = await createServer({
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
})
try {
  const { default: App } = await vite.ssrLoadModule('/src/App.jsx')
  const game = renderToString(createElement(App))
  const ownershipTags = [
    ['google-site-verification', process.env.GOOGLE_SITE_VERIFICATION],
    ['naver-site-verification', process.env.NAVER_SITE_VERIFICATION],
  ].filter(([, value]) => value?.trim()).map(([name, value]) =>
    renderToStaticMarkup(createElement('meta', { name, content: value.trim() }))
  ).join('\n')
  await writeFile(entry, html.replace('</head>', () => ownershipTags + '\n</head>').replace(marker, () => game))
} finally {
  await vite.close()
}
