import fsp from 'node:fs/promises'
import { cac } from 'cac'
import color from 'picocolors'
import type { CliOptions } from './types'
import { scraperMedias, downloadMedias } from './scraper'

const cli = cac('twid')
const XURL = 'https://twitter.com/'
cli
  .command('<...users>')
  .option('-O, --outDir [outDir]', 'The output dir', {
    default: 'media-dist',
  })
  .option('-T, --token <token>', 'The auth_token of cookies')
  .option('-D, --dev [dev]', 'Dev mode, Set headless and devtools to true', {
    default: false,
  })
  .option('-P, --product [product]', 'Use chrome of firefox', {
    default: 'chrome',
  })
  .action(
    async (users: string[], { outDir, token, dev, product }: CliOptions) => {
      if (!token) {
        console.log(color.red('ℹ need --token option'))
        return
      }
      console.log(
        `${color.green('ℹ')} users(${users.length}) ❯ (${color.cyan(
          users.join(', '),
        )})`,
      )
      await Promise.race(
        users.map(async (user) => {
          const start = Date.now()
          const outputDir = outDir + '/' + user
          const baseUrl = XURL + user
          fsp.mkdir(outputDir, { recursive: true })
          const { images, videos } = await scraperMedias(baseUrl, user, {
            token,
            dev,
            product,
          })

          console.log(
            color.green('✔ ') +
              color.cyan('user') +
              `(${user}) ❯ ` +
              `${images.length} images, ${videos.length} videos`,
          )
          await downloadMedias([...images, ...videos], user, {
            outDir: outputDir,
          })
          console.log(
            color.green('✔ ') +
              color.cyan('user') +
              `(${user}) ❯ ` +
              `${Date.now() - start}ms`,
          )
        }),
      )
    },
  )

cli.help()
cli.parse()
