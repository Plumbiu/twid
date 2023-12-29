import type { Product } from 'puppeteer'

export interface Media {
  url: string
}

export interface CliOptions {
  outDir: string
  token: string
  dev: boolean
  product: Product
}
