import { cac } from 'cac'
import colors from 'picocolors'
import type { CliOptions, Media } from './types'
import { isCompliantUrl, mkChainDir, resolveURL } from './utils'
import { scraperImg, dlImg } from './scraper'

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
      console.log(
        `${colors.green('ℹ')} users(${users.length}) ❯ (${colors.cyan(
          users.join(', '),
        )})`,
      )
      Promise.all(
        users.map(async (user) => {
          const outputDir = outDir + '/' + user
          const baseUrl = XURL + user
          mkChainDir(outputDir)
          const medias: Media[] = (
            await scraperImg(baseUrl, {
              token,
              dev,
              product,
            })
          )
            .map((raw) => ({
              url: resolveURL(baseUrl, raw),
            }))
            .filter((m) => isCompliantUrl(m.url))

          console.log(
            colors.green('✔ ') +
              colors.cyan('user(') +
              user +
              ') ❯ ' +
              `find ${medias.length} images`,
          )
          await dlImg(medias, user, { outDir: outputDir, dev, product })
          console.log(
            colors.green('✔ ') +
              colors.cyan('user(') +
              user +
              ') ❯ ' +
              `save ${medias.length} images`,
          )
        }),
      )
    },
  )

cli.help()
cli.parse()
