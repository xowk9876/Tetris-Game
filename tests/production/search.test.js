import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { CONFIG } from '../../src/utils/gameConfig.js'

const site = 'https://tetrisgame-fawn.vercel.app'
const dist = new URL('../../dist/', import.meta.url)
const read = path => readFile(new URL(path, dist), 'utf8')

test('the production homepage serves its game title and guide link before JavaScript runs', async () => {
  const home = await read('index.html')
  const main = home.match(/<main id="root">([\s\S]*?)<\/main>/)?.[1]
  assert.ok(main, 'missing pre-rendered game')
  assert.match(main, /<h1[^>]*>[\s\S]*?테트리스[\s\S]*?<\/h1>/)
  assert.match(main, /<a href="\/how-to-play\.html"/)
  assert.ok(!home.includes('<!--app-html-->'))
})

test('the search site name matches the home metadata and supplies a hostname fallback', async () => {
  const home = await read('index.html')
  const json = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]
  assert.ok(json, 'missing structured data')
  const website = JSON.parse(json)['@graph'].find(node => node['@type'] === 'WebSite')
  assert.equal(website?.url, site + '/')
  assert.ok(website.alternateName.includes(new URL(site).hostname))
  assert.ok(home.includes('<meta property="og:site_name" content="' + website.name + '">'))
})

test('the game links to a static mobile guide with its control image', async () => {
  const home = await read('index.html')
  const guide = await read('how-to-play.html')
  assert.ok(home.includes('href="/how-to-play.html#mobile-controls"'))
  assert.match(guide, /<h2 id="mobile-controls">/)
  assert.ok(guide.includes('src="/mobile-controls.webp"'))
  const image = await readFile(new URL('mobile-controls.webp', dist))
  assert.equal(image.toString('ascii', 0, 4), 'RIFF')
  assert.equal(image.toString('ascii', 8, 12), 'WEBP')
})

test('the sitemap and canonical URLs point to both public pages', async () => {
  const xml = await read('sitemap.xml')
  assert.ok((await read('robots.txt')).includes('Sitemap: ' + site + '/sitemap.xml'))
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
  assert.deepEqual(locations, [site + '/', site + '/how-to-play.html'])
  for (const url of locations) {
    const html = await read(new URL(url).pathname.slice(1) || 'index.html')
    assert.ok(html.includes('<link rel="canonical" href="' + url + '">'))
    assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1)
    assert.doesNotMatch(html, /<meta[^>]+content="[^"]*noindex/i)
  }
})

test('both pages advertise the square PNG favicon in the production build', async () => {
  for (const page of ['index.html', 'how-to-play.html']) {
    const head = (await read(page)).split('</head>')[0]
    const links = head.match(/<link\b[^>]*>/g) ?? []
    assert.ok(links.some(link => link.includes('rel="icon"') && link.includes('href="/favicon.png"')), page)
  }

  const png = await readFile(new URL('favicon.png', dist))
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
  assert.equal(png.readUInt32BE(16), 192, 'PNG width')
  assert.equal(png.readUInt32BE(20), 192, 'PNG height')
  const ico = await readFile(new URL('favicon.ico', dist))
  assert.equal(ico.readUInt16LE(2), 1, 'ICO file type')
  assert.ok(ico.readUInt16LE(4) > 0, 'ICO has at least one image')
})

test('the guide links back to the game and publishes its actual base scores', async () => {
  const guide = await read('how-to-play.html')
  assert.match(guide, /<a[^>]+href="\/"/)
  for (const [lines, score] of Object.entries(CONFIG.SCORES)) {
    assert.ok(guide.includes(lines + '줄</th><td>' + score.toLocaleString('ko-KR') + '점</td>'))
  }
})
