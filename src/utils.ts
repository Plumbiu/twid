import fs from 'node:fs'
import { Page } from 'puppeteer'

export async function wait(mil: number) {
  await new Promise((r) => setTimeout(r, mil))
}

export function resolveURL(url: string) {
  return url.replace(/([&\?])name=[^&]+/, '$1name=large')
}

export function resolveURLType(url: string) {
  const serach = new URLSearchParams(url.slice(url.lastIndexOf('?') + 1))
  return serach.get('format')
}

export function resolveChainDir(dir: string) {
  const dirArr = dir.split('/')
  let root = dirArr[0]
  const chainDir = [root]
  for (let i = 1; i < dirArr.length; i++) {
    root += '/' + dirArr[i]
    chainDir.push(root)
  }

  return chainDir
}

export function mkChainDir(dir: string) {
  for (const chain of resolveChainDir(dir)) {
    if (!fs.existsSync(chain)) {
      fs.mkdirSync(chain)
    }
  }
}

const excludesUrl = [
  'profile_banners',
  'profile_images',
  'type=javascript',
  'emoji/v2',
  'ext_tw_video_thumb',
  '.svg',
]
export function isCompliantUrl(url: string) {
  if (excludesUrl.some((u) => url.includes(u))) {
    return false
  }
  return true
}

/**
 * https://github.com/puppeteer/puppeteer/issues/305#issuecomment-385145048
 */
export async function scrollToBottom(page: Page) {
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
