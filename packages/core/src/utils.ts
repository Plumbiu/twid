import https from 'node:https'
import fs from 'node:fs'
import color from 'picocolors'
import { Media, MediaType } from 'twid-share'
import type { Ora } from 'ora'
import { GIF_PARAM, USER_AGENT_HEADER } from './constant'

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
  videos: Set<string>,
  user: string,
  spinner: Ora,
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
    videos.add(resolveMediaBuild(videoUrl, ext, 'video'))
    spinner.text =
      '  ' + color.cyan(user) + ` ❯ ${color.green(videoUrl)} ❯ ` + ext
  }
}

export function resolveMediaBuild(url: string, ext: string, type: MediaType) {
  return `${url}___@${ext}___@${type}`
}

export function resolveFormatMedia(medias: Set<string>) {
  return [...medias].map((str) => {
    const [url, ext, type] = str.split('___@')
    return {
      url,
      ext,
      type,
    } as Media
  })
}

export function resolveFileId(url: string, type: MediaType) {
  const result = url.slice(url.lastIndexOf('/') + 1, url.lastIndexOf('?'))
  if (type === 'image') {
    return result
  }
  return result.slice(0, result.lastIndexOf('.'))
}

export function streamPipe(url: string, outputDir: string) {
  return new Promise<void>((resolve) => {
    https.get(
      url,
      {
        ...USER_AGENT_HEADER,
      },
      (res) => {
        res.pipe(fs.createWriteStream(outputDir))
        res.on('end', () => {
          resolve()
        })
      },
    )
  })
}
