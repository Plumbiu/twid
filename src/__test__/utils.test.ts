import { expect, test } from 'vitest'
import {
  isCompliantUrl,
  resolveChainDir,
  resolveURLParams,
  resolveURLType,
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
  expect(resolveURLType(p)).toBe(null)
})

test('resolveURLParams', () => {
  let p = 'http://foo?name=small'
  expect(resolveURLParams(p)).toBe('http://foo?name=large')
  p = 'http://foo?name=small&format=jpg'
  expect(resolveURLParams(p)).toBe('http://foo?name=large&format=jpg')
  p = 'http://name=ff?name=small&format=jpg'
  expect(resolveURLParams(p)).toBe('http://name=ff?name=large&format=jpg')
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
