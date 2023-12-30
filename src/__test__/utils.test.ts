/* eslint-disable @stylistic/max-len */
import { expect, test } from 'vitest'
import media from './usermedia.json'
import {
  isCompliantUrl,
  resolveChainDir,
  resolveFormatMedia,
  resolveURLType,
  resolveVideoInfo,
} from 'src/utils'

test('resolveChainDir', () => {
  let p = 'foo'
  expect(resolveChainDir(p)).toEqual(['foo'])
  p += '/bar'
  expect(resolveChainDir(p)).toEqual(['foo', 'foo/bar'])
  p += '/baz'
  expect(resolveChainDir(p)).toEqual(['foo', 'foo/bar', 'foo/bar/baz'])
})

test('resolveURLType', () => {
  let p = 'http://foo?format=jpg'
  expect(resolveURLType(p)).toBe('jpg')
  p += 'foo?format=png&name=bar'
  expect(resolveURLType(p)).toBe('png')
  p += 'foo?'
  expect(resolveURLType(p)).toBe('jpg')
})

test('isCompliantUrl', () => {
  let p = 'http://profile_banners'
  expect(isCompliantUrl(p)).toBe(false)
  p = 'http:emoji/v2'
  expect(isCompliantUrl(p)).toBe(false)
  p = 'http://profile_images/foo/bar'
  expect(isCompliantUrl(p)).toBe(false)
  p = 'https://foo?type=javascript'
  expect(isCompliantUrl(p)).toBe(false)
  p = 'https://foo/emoji/v2'
  expect(isCompliantUrl(p)).toBe(false)
  p = 'http://twitter/ext_tw_video_thumb'
  expect(isCompliantUrl(p)).toBe(false)
  p = 'http://vue.js/org.svg'
  expect(isCompliantUrl(p)).toBe(false)
  p = 'http://foo'
  expect(isCompliantUrl(p)).toBe(true)
  p = 'http://bar'
  expect(isCompliantUrl(p)).toBe(true)
})

test('resolveVideoInfo', () => {
  const str = JSON.stringify(media)
  const set = new Set<string>()
  resolveVideoInfo(str, set, 'foo')
  expect([...set]).toEqual([
    'https://video.twimg.com/amplify_video/1736962036008181760/vid/avc1/1920x1080/zhWFJB1NdwIelHxh.mp4?tag=16___@mp4___@video',
    'https://video.twimg.com/amplify_video/1736959943000170496/vid/avc1/1920x1080/r7IzOTQ8kszIJjMZ.mp4?tag=16___@mp4___@video',
    'https://video.twimg.com/amplify_video/1733037232859316224/vid/avc1/1920x1080/4kt_i6MLX7YsuvaE.mp4?tag=16___@mp4___@video',
    'https://video.twimg.com/ext_tw_video/1732820284301058052/pu/vid/avc1/1920x1080/K2NITCly19drRgED.mp4?tag=14___@mp4___@video',
  ])
})

test('resolveFormatMedia', () => {
  const str = JSON.stringify(media)
  const set = new Set<string>()
  resolveVideoInfo(str, set, 'foo')
  expect(resolveFormatMedia(set)).toEqual([
    {
      url: 'https://video.twimg.com/amplify_video/1736962036008181760/vid/avc1/1920x1080/zhWFJB1NdwIelHxh.mp4?tag=16',
      ext: 'mp4',
      type: 'video',
    },
    {
      url: 'https://video.twimg.com/amplify_video/1736959943000170496/vid/avc1/1920x1080/r7IzOTQ8kszIJjMZ.mp4?tag=16',
      ext: 'mp4',
      type: 'video',
    },
    {
      url: 'https://video.twimg.com/amplify_video/1733037232859316224/vid/avc1/1920x1080/4kt_i6MLX7YsuvaE.mp4?tag=16',
      ext: 'mp4',
      type: 'video',
    },
    {
      url: 'https://video.twimg.com/ext_tw_video/1732820284301058052/pu/vid/avc1/1920x1080/K2NITCly19drRgED.mp4?tag=14',
      ext: 'mp4',
      type: 'video',
    },
  ])
})
