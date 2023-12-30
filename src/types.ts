import type { Product } from 'puppeteer'

export type MediaType = 'image' | 'video'

export interface Media {
  url: string
  ext: string
  type: MediaType
}

export interface CliOptions {
  outDir: string
  token: string
  dev: boolean
  product: Product
  limit: number
}
