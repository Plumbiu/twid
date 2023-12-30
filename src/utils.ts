import fs from 'node:fs'
import color from 'picocolors'
import { Media } from './types'

export async function wait(mil: number) {
  await new Promise((r) => setTimeout(r, mil))
}

export function resolveURL(url: string) {
  return url.replace(/([&\?])name=[^&]+/, '$1name=large')
}

export function resolveURLType(url: string) {
  const serach = new URLSearchParams(url.slice(url.lastIndexOf('?') + 1))
  return serach.get('format') ?? 'jpg'
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
export const GIF_PARAM = '/tweet_video_thumb/'

export function isGifUrl(url: string) {
  return url.includes(GIF_PARAM)
}

const VIDEO_REGX = /\"video_info\"/g

interface VideoVarinat {
  bitrate: number
  content_type: string
  url: string
}

export function resolveVideoInfo(
  data: string,
  videos: Set<Media>,
  user: string,
) {
  let m
  while ((m = VIDEO_REGX.exec(data))) {
    const videoVariantsIdx = data.indexOf('variants', m.index)
    if (videoVariantsIdx === -1) {
      return
    }
    const rightBracket = data.indexOf(']', videoVariantsIdx)
    const leftBracket = data.indexOf('[', videoVariantsIdx)
    if (rightBracket === -1 || leftBracket === -1) {
      return
    }
    const variants: VideoVarinat[] = JSON.parse(
      data.slice(leftBracket, rightBracket + 1),
    )
    let max = 0
    let videoUrl = ''
    let ext = ''
    for (const { bitrate, url, content_type } of variants) {
      if (bitrate > max) {
        max = bitrate
        videoUrl = url
        ext = content_type.split('/')[1]
      }
    }
    if (ext === '' || videoUrl === '') {
      return
    }
    videos.add({ url: videoUrl, ext: ext, type: 'video' })
    console.log(
      '  ' + color.cyan(user) + ` ❯ ${color.green(videoUrl)} ❯ ` + ext,
    )
  }
}
