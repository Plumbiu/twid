import type { Product } from 'puppeteer'

export type MediaType = 'image' | 'video'

export interface Media {
  url: string
  ext: string
  type: MediaType
}

export interface Config {
  outDir: string
  token: string
  dev: boolean
  product: Product
}
