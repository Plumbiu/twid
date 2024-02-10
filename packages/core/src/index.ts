import fsp from 'node:fs/promises'
import { launch, type Page, KnownDevices } from 'puppeteer'
import color from 'picocolors'
import type { Config, Media } from 'twid-share'
import ora from 'ora'
import {
  isCompliantUrl,
  isGifUrl,
  resolveFileId,
  resolveFormatMedia,
  resolveMediaBuild,
  resolveURL,
  resolveURLType,
  resolveVideoInfo,
  streamPipe,
  wait,
} from './utils'
import { GIF_PARAM, XURL } from './constant'

const iPhone = KnownDevices['iPhone SE']

export async function scraperMedias(
  baseUrl: string,
  user: string,
  { token, dev, product }: Pick<Config, 'token' | 'dev' | 'product'>,
) {
  const spinner = ora('browser launching ....').start()
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
  let i = 1
  page.on('request', async (req) => {
    const reqType = req.resourceType()
    if (reqType === 'image') {
      const reqUrl = req.url()
      if (isGifUrl(reqUrl)) {
        const hash = reqUrl.slice(
          reqUrl.indexOf(GIF_PARAM) + GIF_PARAM.length,
          reqUrl.lastIndexOf('?'),
        )
        const url = `https://video.twimg.com/tweet_video/${hash}.mp4`
        videos.add(resolveMediaBuild(url, 'mp4', 'video'))
      } else if (isCompliantUrl(reqUrl)) {
        const url = resolveURL(reqUrl)
        const ext = resolveURLType(reqUrl)
        images.add(resolveMediaBuild(url, ext, 'image'))
      }
      spinner.text = `find ${color.underline(i++)} images and ${color.underline(
        videos.size,
      )} videos`
    }
  })
  page.on('response', async (res) => {
    const url = res.url()
    if (url.includes('UserMedia')) {
      const requestSource = await res.text()
      resolveVideoInfo(requestSource, videos, user, spinner)
    }
  })

  await scrollToBottom(page)
  await wait(500)
  await page.close()
  await browser.close()
  spinner.stop()
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
        outputDir || `${outDir}/${resolveFileId(url, type)}.${ext}`
      try {
        await streamPipe(url, failed, {
          url,
          ext,
          type,
          outputDir: writePath,
        })
      } catch (error: any) {
        failed.push({
          url,
          ext,
          type,
          outputDir: writePath,
        })
      }
      console.log(
        '  ' +
          color.cyan(user) +
          ` ❯ ${color.green(writePath)} ❯ ` +
          color.white(`${i++}/${total}`),
      )
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
        )
        console.log(
          color.green(`✔ ${i === 0 ? '' : `retry(${i})`} ❯ `) +
            color.cyan('user') +
            `(${user}) ❯ ` +
            `${Date.now() - start}ms`,
        )
        currMedias = prevMedias
        prevMedias = []
      }
      console.log(
        color.red(`✘ failed(${currMedias.length})`) +
          ' ❯ ' +
          color.cyan('user\n') +
          currMedias
            .map(
              (item) =>
                // eslint-disable-next-line @stylistic/implicit-arrow-linebreak
                `  ${color.cyan(user)} ❯ ${color.yellow(item.url)} ❯ ${
                  item.ext
                }`,
            )
            .join('\n'),
      )
    }),
  )
}

export * from './utils'
export * from './constant'
