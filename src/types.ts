import type { Product } from 'puppeteer'

export interface Media {
  url: string
  ext: string
  type: 'image' | 'video'
}

export interface CliOptions {
  outDir: string
  token: string
  dev: boolean
  product: Product
}
