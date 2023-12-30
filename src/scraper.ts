import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { launch, type Page } from 'puppeteer'
import color from 'picocolors'
import axios from 'axios'
import { CliOptions, Media } from './types'
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

export async function scraperMedias(
  url: string,
  user: string,
  { token, dev, product }: Pick<CliOptions, 'token' | 'dev' | 'product'>,
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
  page.on('request', async (req) => {
    const reqType = req.resourceType()
    const reqUrl = req.url()
    if (reqType === 'image') {
      if (isGifUrl(reqUrl)) {
        const hash = reqUrl.slice(
          reqUrl.indexOf(GIF_PARAM) + GIF_PARAM.length,
          reqUrl.lastIndexOf('?'),
        )
        const videoUrl = `https://video.twimg.com/tweet_video/${hash}.mp4`
        videos.add(resolveMediaBuild(url, 'mp4', 'video'))
        console.log(
          '  ' + color.cyan(user) + ` ❯ ${color.green(videoUrl)} ❯ ` + 'mp4',
        )
      } else if (isCompliantUrl(reqUrl)) {
        const imageUrl = resolveURL(reqUrl)
        const imageExt = resolveURLType(reqUrl)
        images.add(resolveMediaBuild(imageUrl, imageExt, 'image'))
        console.log(
          '  ' + color.cyan(user) + ` ❯ ${color.green(imageUrl)} ❯ ` + imageExt,
        )
      }
    }
  })
  page.on('response', async (res) => {
    const requestUrl = res.url()
    if (requestUrl.includes('UserMedia')) {
      const requestSource = await res.text()
      resolveVideoInfo(requestSource, videos, user)
    }
  })
  await scrollToBottom(page)
  await page.close()
  await browser.close()

  return {
    images: resolveFormatMedia(images),
    videos: resolveFormatMedia(videos),
  }
}

export async function downloadMedias(
  medias: Media[],
  user: string,
  { outDir }: Pick<CliOptions, 'outDir'>,
) {
  const total = medias.length
  let i = 1
  await Promise.all(
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
        console.error(error.message)
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
      }, 300)
    })
  })
}
