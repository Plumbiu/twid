import fs from 'node:fs/promises'
import { launch } from 'puppeteer'
import color from 'picocolors'
import { CliOptions, Media } from './types'
import { isCompliantUrl, resolveURLType, scrollToBottom } from './utils'

export async function scraperImg(
  url: string,
  { token, dev, product }: Pick<CliOptions, 'token' | 'dev' | 'product'>,
) {
  const browser = await launch({
    ignoreHTTPSErrors: true,
    headless: dev ? false : 'new',
    devtools: dev === true ? true : false,
    product,
  })
  const imgs: Set<string> = new Set()
  const page = await browser.newPage()

  await page.goto(url, {
    waitUntil: ['load'],
  })
  await page.setCookie({
    name: 'auth_token',
    value: token,
  })
  await page.reload()
  await page.goto(url + '/media')
  await page.setViewport({
    width: 0,
    height: 2000,
    deviceScaleFactor: 0.1,
  })
  page.on('request', (req) => {
    if (req.resourceType() === 'image') {
      const url = req.url()
      // TODO: support video
      if (isCompliantUrl(url)) {
        imgs.add(url)
      }
    }
  })
  // await page.waitForSelector('img')
  await scrollToBottom(page)
  await page.close()
  await browser.close()
  return [...imgs]
}

const BASE64_REX = /^data:(.+);base64,(.+)$/
export async function dlImg(
  meidas: Media[],
  user: string,
  { outDir, dev, product }: Pick<CliOptions, 'outDir' | 'dev' | 'product'>,
) {
  const total = meidas.length
  const browser = await launch({
    ignoreHTTPSErrors: true,
    headless: dev ? false : 'new',
    devtools: dev ? true : false,
    product,
  })
  // FIXME: Promise.all doesn't work for puppeteer
  for (let i = 0; i < total; i++) {
    const { url } = meidas[i]
    let writePath: string = ''
    try {
      const writePerfix = `./${outDir}/${Date.now()}`
      // base64
      if (!url.startsWith('http')) {
        const m = url.match(BASE64_REX)
        if (m === null || m[2] === undefined) {
          return
        }
        writePath = `${writePerfix}.${m[1].split('/')[1]}`
        fs.writeFile(writePath, m[2])
        return
      }

      const page = await browser.newPage()
      await page.goto(url, {
        waitUntil: ['load'],
      })
      await page.setCacheEnabled(false)
      const img = await page.waitForSelector('img')
      const buffer = await img?.screenshot()
      if (buffer === undefined) {
        return
      }
      writePath = `${writePerfix}.${resolveURLType(url)}`
      await fs.writeFile(writePath, buffer)
      await page.close()
    } catch (error: any) {
      console.error(error.message)
    } finally {
      console.log(
        '  ' +
          color.cyan(user) +
          ' ❯ ' +
          color.green(writePath) +
          '  ' +
          color.bold(color.white(`${i + 1}/${total}`)),
      )
    }
  }
  await browser.close()
}
