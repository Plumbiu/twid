import { cac } from 'cac'
import color from 'picocolors'
import type { Config } from 'twid-share'
import { execMediaDownload } from 'twid-core'

const cli = cac('twid')
cli
  .command('<...users>')
  .option('-O, --outDir [outDir]', 'The output dir', {
    default: 'twid-dist',
  })
  .option('-T, --token <token>', 'The auth_token of cookies')
  .option('-D, --dev [dev]', 'Dev mode, Set headless and devtools to true', {
    default: false,
  })
  .option('-R, --retry [proretryduct]', 'Retry times', {
    default: 3,
  })
  .option('-P, --product [product]', 'Use chrome of firefox', {
    default: 'chrome',
  })
  .action(async (users: string[], cliConfig: Config) => {
    if (!cliConfig.token) {
      console.log(color.red('ℹ need --token option'))
    } else {
      console.log(
        `${color.green('ℹ')} users(${users.length}) ❯ (${color.cyan(
          users.join(', '),
        )})`,
      )
      await execMediaDownload(users, cliConfig)
    }
  })

cli.help()
cli.parse()
