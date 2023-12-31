import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { launch, type Page, KnownDevices } from 'puppeteer'
import color from 'picocolors'
import axios from 'axios'
import { Config, Media } from './types'
import {
  GIF_PARAM,
  isCompliantUrl,
  isGifUrl,
  resolveFormatMedia,
  resolveMediaBuild,
  resolveURL,
  resolveURLType,
  resolveVideoInfo,
} from './utils'
import { XURL } from './constant'

const iPhone = KnownDevices['iPhone 6']

export async function scraperMedias(
  baseUrl: string,
  user: string,
  { token, dev, product }: Pick<Config, 'token' | 'dev' | 'product'>,
) {
  const browser = await launch({
    ignoreHTTPSErrors: true,
    headless: dev ? false : 'new',
    devtools: dev === true ? true : false,
    product,
  })
  const images: Set<string> = new Set()
  const videos: Set<string> = new Set()
  const page = await browser.newPage()
  // mobile device cost less flow and take less time to load
  await page.emulate(iPhone)
  await page.goto(baseUrl)
  await page.setCookie({
    name: 'auth_token',
    value: token,
  })
  await page.goto(baseUrl + '/media')
  page.on('request', async (req) => {
    const reqType = req.resourceType()
    const reqUrl = req.url()
    if (reqType === 'image') {
      if (isGifUrl(reqUrl)) {
        const hash = reqUrl.slice(
          reqUrl.indexOf(GIF_PARAM) + GIF_PARAM.length,
          reqUrl.lastIndexOf('?'),
        )
        const url = `https://video.twimg.com/tweet_video/${hash}.mp4`
        videos.add(resolveMediaBuild(url, 'mp4', 'video'))
        console.log(
          '  ' + color.cyan(user) + ` ❯ ${color.green(url)} ❯ ` + 'mp4',
        )
      } else if (isCompliantUrl(reqUrl)) {
        const url = resolveURL(reqUrl)
        const ext = resolveURLType(reqUrl)
        images.add(resolveMediaBuild(url, ext, 'image'))
        console.log('  ' + color.cyan(user) + ` ❯ ${color.green(url)} ❯ ` + ext)
      }
    }
  })
  page.on('response', async (res) => {
    const url = res.url()
    if (url.includes('UserMedia')) {
      const requestSource = await res.text()
      resolveVideoInfo(requestSource, videos, user)
    }
  })
  await scrollToBottom(page)
  await browser.close()

  return {
    images: resolveFormatMedia(images),
    videos: resolveFormatMedia(videos),
  }
}

export async function downloadMedias(
  medias: Media[],
  user: string,
  { outDir }: Pick<Config, 'outDir'>,
) {
  const total = medias.length
  let i = 1
  await Promise.race(
    medias.map(async ({ url, ext, type }) => {
      const writePath: string = `./${outDir}/${Date.now()}.${ext}`
      try {
        if (type === 'video') {
          const res = await axios.get(url, { responseType: 'stream' })
          const stream = res.data
          stream.on('error', (err: any) => {
            throw new Error(err.message)
          })
          const writeStream = stream.pipe(fs.createWriteStream(writePath))
          writeStream.on('finish', () => {
            writeStream.close()
          })
          writeStream.on('error', (err: any) => {
            writeStream.close()
            throw new Error(err.message)
          })
        } else {
          const res = await axios.get(url, { responseType: 'arraybuffer' })
          await fsp.writeFile(writePath, res.data)
        }
      } catch (error: any) {
      } finally {
        console.log(
          '  ' +
            color.cyan(user) +
            ` ❯ ${color.green(writePath)} ❯ ` +
            color.white(`${i++}/${total}`),
        )
      }
    }),
  )
}

/**
 * https://github.com/puppeteer/puppeteer/issues/305#issuecomment-385145048
 */
async function scrollToBottom(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve, _reject) => {
      let totalHeight = 0
      const distance = 100
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight
        window.scrollBy(0, distance)
        totalHeight += distance
        if (totalHeight >= scrollHeight) {
          clearInterval(timer)
          resolve()
        }
      }, 350)
    })
  })
}

export async function execMediaDownload(users: string[], options: Config) {
  const { outDir, token, dev, product } = options
  await Promise.race(
    users.map(async (user) => {
      const start = Date.now()
      const outputDir = outDir + '/' + user
      const baseUrl = XURL + user
      // scrape is slow, mkdir can be sync
      fsp.mkdir(outputDir, { recursive: true })
      const { images, videos } = await scraperMedias(baseUrl, user, {
        token,
        dev,
        product,
      })

      console.log(
        color.green('✔ ') +
          color.cyan('user') +
          `(${user}) ❯ ` +
          `${images.length} images, ${videos.length} videos`,
      )
      await downloadMedias([...images, ...videos], user, {
        outDir: outputDir,
      }).finally(() => {
        console.log(
          color.green('✔ ') +
            color.cyan('user') +
            `(${user}) ❯ ` +
            `${Date.now() - start}ms`,
        )
      })
    }),
  )
}
