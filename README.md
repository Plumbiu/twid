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
