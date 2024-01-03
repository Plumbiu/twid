# twid - Twitter Intelligent Download

> Scraping Twitter by headless mode, no API and limit.

# Install

```bash
npm i -g twid
```

# Usage

> [!NOTE]  
> The token option is required because cookies are required to access the Twitter user's media resources.

## Simple Usage

```bash
# twid <...users>
# Two users
twid elonmusk youyuxi --token YOUR_TOKEN
```

> [!NOTE]
> The users parameter is in the url, like `https://twitter.com/elonmusk`

## --token

You can find `token` in `devtool -> application -> Cookie(chosse https://twitter.com) -> auth_token`:

![](/assets/cookie.png)

```bash
twid youyuxi --token YOUR_TOKEN
```

## Other options

```bash
twid --help
```

```txt
Usage:
  $ twid <...users>

Commands:
  <...users>  

For more info, run any command with the `--help` flag:
  $ twid --help

Options:
  -O, --outDir [outDir]       The output dir (default: twid-dist)
  -T, --token <token>         The auth_token of cookies 
  -D, --dev [dev]             Dev mode, Set headless and devtools to true (default: false)
  -R, --retry [proretryduct]  Retry times (default: 3)
  -P, --product [product]     Use chrome of firefox (default: chrome)
  -h, --help                  Display this message
```
