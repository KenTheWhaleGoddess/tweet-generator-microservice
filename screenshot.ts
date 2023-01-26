import { NowRequest, NowResponse } from '@now/node'
import chrome from 'chrome-aws-lambda'
import chromium from 'chrome-aws-lambda';

import extractTweetData from './extractTweetData'

export default async (req: NowRequest, res: NowResponse) => {
  const tweetData = await extractTweetData(req, res)

  try {
    const options = {
      headless: true,
      defaultViewport: {
        width: 600,
        height: 200,
        deviceScaleFactor: 3.2
      },
      ...(process.env.NODE_ENV === 'development'
        ? {
          executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          ignoreDefaultArgs: ['--disable-extensions']
        }
        : {
          args: chrome.args,
          executablePath: await chrome.executablePath,
          headless: chrome.headless
        })
    }
  
    const browser = await chromium.puppeteer.launch({
       args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
       defaultViewport: chromium.defaultViewport,
       executablePath: await chromium.executablePath,
       headless: true,
       ignoreHTTPSErrors: true,
    })
    const page = await browser.newPage()
    await page.goto(`${req.headers['x-forwarded-proto']}://${req.headers['x-now-deployment-url']}/tweet?tweetData=${JSON.stringify(tweetData)}&style=${req.query.style || ''}`)
    const file = await page.screenshot({
      type: 'png',
      fullPage: true,
      omitBackground: true
    })
    await browser.close()

    res.statusCode = 200
    res.setHeader('Content-Type', 'image/png')
    res.end(file)
  }
  catch (error) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/html')
    res.end('<h1>Server Error</h1><p>Sorry, there was a problem</p>')
    console.error(error.message)
  }
}
