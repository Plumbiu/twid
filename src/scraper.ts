import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { launch, type Page, KnownDevices } from 'puppeteer'
import color from 'picocolors'
import axios from 'axios'
import { Config, Media } from './types'
import {
  isCompliantUrl,
  isGifUrl,
  resolveFileId,
  resolveFormatMedia,
  resolveMediaBuild,
  resolveURL,
  resolveURLType,
  resolveVideoInfo,
  wait,
} from './utils'
import { GIF_PARAM, USER_AGENT_HEADER, XURL } from './constant'

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
  await page.setViewport({
    width: 50,
    height: 0,
  })
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
  await wait(1500)
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
  failed: Media[],
) {
  const total = medias.length
  let i = 1
  await Promise.all(
    medias.map(async ({ url, ext, type, outputDir }) => {
      const writePath: string =
        outputDir || `./${outDir}/${resolveFileId(url, type)}.${ext}`
      try {
        if (type === 'video') {
          const res = await axios.get(url, {
            responseType: 'stream',
            ...USER_AGENT_HEADER,
          })
          const stream = res.data
          const writeStream = stream.pipe(fs.createWriteStream(writePath))
          writeStream.on('finish', () => {
            writeStream.close()
          })
          writeStream.on('error', (err: any) => {
            writeStream.close()
            throw new Error(err.message)
          })
        } else {
          const res = await axios.get(url, {
            responseType: 'arraybuffer',
            ...USER_AGENT_HEADER,
          })
          await fsp.writeFile(writePath, res.data)
        }
      } catch (error: any) {
        failed.push({
          url,
          ext,
          type,
          outputDir: writePath,
        })
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
      }, 500)
    })
  })
}

export async function execMediaDownload(users: string[], options: Config) {
  const { outDir, token, dev, product, retry } = options
  await Promise.all(
    users.map(async (user) => {
      const start = Date.now()
      const outputDir = outDir + '/' + user
      const baseUrl = XURL + user
      // scrape is slow, mkdir can be sync
      await fsp.mkdir(outputDir, { recursive: true })
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
      let prevMedias: Media[] = []
      let currMedias: Media[] = [...images, ...videos]
      for (let i = 0; i < retry; i++) {
        await downloadMedias(
          currMedias,
          user,
          {
            outDir: outputDir,
          },
          prevMedias,
        ).finally(() => {
          console.log(
            color.green(`✔ ${i === 0 ? '' : `retry(${i}) `}`) +
              color.cyan('user') +
              `(${user}) ❯ ` +
              `${Date.now() - start}ms`,
          )
        })
        currMedias = prevMedias
        prevMedias = []
      }
      console.log(
        color.red(`faild(${currMedias.length})`) +
          ' ❯ ' +
          color.yellow(currMedias.join('\n')),
      )
    }),
  )
}
