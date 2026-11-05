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

test('the guide links back to the game and publishes its actual base scores', async () => {
  const guide = await read('how-to-play.html')
  assert.match(guide, /<a[^>]+href="\/"/)
  for (const [lines, score] of Object.entries(CONFIG.SCORES)) {
    assert.ok(guide.includes(lines + '줄</th><td>' + score.toLocaleString('ko-KR') + '점</td>'))
  }
})
