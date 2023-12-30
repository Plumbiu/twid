import { cac } from 'cac'
import colors from 'picocolors'
import type { CliOptions } from './types'
import { mkChainDir } from './utils'
import { scraperMedias, downloadMedias } from './scraper'

const cli = cac('twid')
const XURL = 'https://twitter.com/'
cli
  .command('<...users>')
  .option('-O, --outDir [outDir]', 'The output dir', {
    default: 'media-dist',
  })
  .option('-T, --token <token>', 'The auth_token of cookies')
  .option('-D, --dev [dev]', 'Set headless and devtools to true', {
    default: false,
  })
  .option('-P, --product [product]', 'Use chrome of firefox', {
    default: 'chrome',
  })
  .action(
    async (users: string[], { outDir, token, dev, product }: CliOptions) => {
      if (!token) {
        console.log(colors.red('ℹ need --token option'))
        return
      }
      console.log(
        `${colors.green('ℹ')} users(${users.length}) ❯ (${colors.cyan(
          users.join(', '),
        )})`,
      )
      const start = Date.now()
      await Promise.all(
        users.map(async (user) => {
          const outputDir = outDir + '/' + user
          const baseUrl = XURL + user
          mkChainDir(outputDir)
          const { images, videos } = await scraperMedias(baseUrl, user, {
            token,
            dev,
            product,
          })

          console.log(
            colors.green('✔ ') +
              colors.cyan('user') +
              `(${user}) ❯ ` +
              `${images.length} images, ${videos.length} videos`,
          )
          await downloadMedias([...images, ...videos], user, {
            outDir: outputDir,
          })
          console.log(
            colors.green('✔ ') +
              colors.cyan('user') +
              `(${user}) ❯ ` +
              `${Date.now() - start}ms`,
          )
        }),
      )
    },
  )

cli.help()
cli.parse()
