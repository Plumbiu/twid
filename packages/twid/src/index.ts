import fs from 'node:fs'
import { cac } from 'cac'
import color from 'picocolors'
import type { Config } from 'twid-share'
import { execMediaDownload } from 'twid-core'

const CONFIG_FILE = 'twid.config.json'

const cli = cac('twid')
cli
  .command('[...users]')
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
    const options: Config & {
      users: string[]
    } = {
      users: [],
      outDir: '',
      token: '',
      dev: false,
      product: 'chrome',
      retry: 3,
    }
    if (fs.existsSync(CONFIG_FILE)) {
      const fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
      Object.assign(options, { ...cliConfig, users }, fileConfig)
    }
    if (!options.token) {
      console.log(color.red('ℹ need --token option'))
    } else if (!options.users) {
      console.log(color.red('ℹ can not find users'))
    } else {
      console.log(
        `${color.green('ℹ')} users(${options.users.length}) ❯ (${color.cyan(
          options.users.join(', '),
        )})`,
      )
      await execMediaDownload(options.users, options)
    }
  })

cli.help()
cli.parse()
