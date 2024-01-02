export type MediaType = 'image' | 'video'

export interface Media {
  url: string
  ext: string
  type: MediaType
  outputDir?: string
}

export interface Config {
  outDir: string
  token: string
  dev: boolean
  retry: number
  product: 'chrome' | 'firefox'
}
