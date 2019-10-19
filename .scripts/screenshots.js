const path = require('path');
const puppeteer = require('puppeteer');
const config = require('../config/config.json');

const debug = true;
const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 800;

const pages = [
  [
    'http://localhost:8000',
    path.join(__dirname, '..', 'doc', 'screenshots', 'trending.png'),
    {
      fullPage: true,
      beforeScreenshot: async (page, browser) => {
        page.type('[data-test="search-input"]', 'John')
      },
    },
  ],
  [
    'http://localhost:8000/movie/458156',
    path.join(__dirname, '..', 'doc', 'screenshots', 'movie.png'),
    {
      beforeScreenshot: async (page, browser) => {
        await page.waitFor(2 * 1000)
        await page.setExtraHTTPHeaders({
          Authorization: `Basic ${Buffer.from(`${config.auth.username}:${config.auth.password}`).toString('base64')}`
        })
        await page.evaluate(() => document.querySelector('[data-test="movie-findReleases"]').click())
        await page.waitFor(2 * 1000)
        await page.click('[data-test="controls-all"]')
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.waitFor(2 * 1000)
        await page.setExtraHTTPHeaders({})
      },
      viewport: {
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_HEIGHT * 3.5,
      },
    },
  ],
  [
    'http://localhost:8000/collection/404609',
    path.join(__dirname, '..', 'doc', 'screenshots', 'collection.png'),
    {
      fullPage: true,
    },
  ],
  [
    'http://localhost:8000/star/6384',
    path.join(__dirname, '..', 'doc', 'screenshots', 'star.png'),
    {
      fullPage: true,
    },
  ],
  [
    'http://localhost:8000/movies/library',
    path.join(__dirname, '..', 'doc', 'screenshots', 'library.png'),
    {
      beforeScreenshot: async (page, browser) => {
        await page.click('[data-test="controls-all"]')
      },
      viewport: {
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_HEIGHT * 2,
      },
    },
  ],
  [
    'http://localhost:8000/movies/calendar',
    path.join(__dirname, '..', 'doc', 'screenshots', 'calendar.png'),
    {
      beforeScreenshot: async (page, browser) => {
        await page.click('[data-test="controls-all"]')
      },
      viewport: {
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_HEIGHT * 2,
      },
    },
  ],
  [
    'http://localhost:8000/movies/records',
    path.join(__dirname, '..', 'doc', 'screenshots', 'records.png'),
    {
      viewport: {
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_HEIGHT * 2,
      },
    },
  ],
  [
    'http://localhost:8000/stars/following',
    path.join(__dirname, '..', 'doc', 'screenshots', 'following.png'),
    {
      beforeScreenshot: async (page, browser) => {
        await page.click('[data-test="controls-all"]')
      },
      viewport: {
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_HEIGHT * 2,
      },
    },
  ],
  // settings
];

(async () => {
  const browser = await puppeteer.launch({
    headless: !debug,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Puppeteer/65.0.3312.0 Safari/537.36"'
    ]
  })
  const page = await browser.newPage()

  // bootstrap
  console.log('🚦', 'Bootstraping database...')
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle2', timeout: 0 })
  await page.evaluate(() => database.get().then(db => db.requestIdlePromise))
  console.log('🏛️ ', 'Database ready !')
  console.log('')

  await page.reload()

  for (let [url, path, options = {}] of pages) {
    console.log('💻', 'Loading', url)
    await page.goto(url, { waitUntil: 'networkidle2' })
    await page.waitFor(10 * 1000)

    if (options.beforeScreenshot) {
      await options.beforeScreenshot(page, browser)
      await page.waitFor(5 * 1000)
    }

    if (options.viewport) {
      await page.setViewport({ width: options.viewport.width, height: options.viewport.height })
    } else {
      await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT })
    }

    let [height, width] = await page.evaluate(() => [
      document.getElementsByTagName('html')[0].offsetHeight,
      document.getElementsByTagName('html')[0].offsetWidth
    ])

    console.log('📸', 'Screenshot', path)
    await page.screenshot({
      path: path,
      ...(options.fullPage ? { clip: { x: 0, y: 0, width, height } } : {}),
    })
    console.log('')
  }

  await browser.close()
})();
