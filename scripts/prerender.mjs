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

// Publish the guides' real HTML and modification dates, not a new date on every build.
const site = 'https://tetrisgame-fawn.vercel.app'
const escapeXml = value => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
})[char])
const guides = await Promise.all(['how-to-play.html', 'tetris-tips.html'].map(async page => {
  const html = await readFile(new URL(page, entry), 'utf8')
  const head = html.split('</head>')[0]
  const graph = JSON.parse(head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph']
  const article = graph.find(node => node['@type'] === 'Article')
  const body = html.match(/<main>([\s\S]*?)<\/main>/)[1]
    .replace(/\b(href|src)="([^"#][^"]*)"/g, (_, attribute, value) =>
      `${attribute}="${new URL(value, article.url).href}"`)
    .replace(/\bhref="#([^"]*)"/g, (_, fragment) => `href="${article.url}#${fragment}"`)
  return { ...article, body }
}))
const rssDate = date => new Date(`${date}T00:00:00+09:00`).toUTCString()
const items = guides.map(guide => `<item>
  <title>${escapeXml(guide.headline)}</title><link>${guide.url}</link>
  <guid isPermaLink="true">${guide.url}</guid>
  <description>${escapeXml(guide.description)}</description>
  <content:encoded><![CDATA[${guide.body.replace(/]]>/g, ']]]]><![CDATA[>')}]]></content:encoded>
  <pubDate>${rssDate(guide.dateModified)}</pubDate>
</item>`).join('\n')
await writeFile(new URL('rss.xml', entry), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel><title>테트리스 조작법과 초보 공략</title><link>${site}/</link>
<description>키보드·터치 조작법, 점수표와 블록 쌓기 공략을 확인하세요.</description><language>ko-KR</language>
<atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml"/>
<lastBuildDate>${rssDate(guides.map(guide => guide.dateModified).sort().at(-1))}</lastBuildDate>
${items}</channel></rss>\n`)
