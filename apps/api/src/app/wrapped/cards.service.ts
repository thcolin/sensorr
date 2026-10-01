import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import puppeteer, { Browser, Page } from 'puppeteer-core'
import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common'
import { WRAPPED_THEME_NAMES, WRAPPED_TIME_ZONE as TIME_ZONE, WrappedTheme } from '@sensorr/sensorr'
import { WrappedService } from './wrapped.service'

// Every story is composed at 396 × 704 and shared at 1080 × 1920: whole CSS pixels at both sizes, a capture rounds to them
const VIEWPORT = { width: 396, height: 704, deviceScaleFactor: 1080 / 396 }
// A story's name in the address: `opening`, `figure-twin`, `summary`; the page says when it has none
const STORY = /^[a-z]+(?:-[a-z_]+)?$/
// The wrapped page the browser opens, served with the API behind it: `sensorr-web` in the compose stack
const ORIGIN = process.env.NX_WRAPPED_URL || 'http://sensorr-web'
const CHROMIUM = process.env.NX_CHROMIUM_PATH || '/usr/bin/chromium'
const FOLDER = join(tmpdir(), 'sensorr-cards')
// A card is drawn again each day, its date and figures move; older files are removed
const KEEP = 2 * 24 * 3600 * 1000
// The browser closes after this long without a card to draw, Chromium holds a few hundred MB
const IDLE = 60 * 1000
const SHARE = 5 * 60 * 1000

@Injectable()
export class CardsService implements OnModuleDestroy {
  private readonly logger = new Logger(CardsService.name)
  private browser: Promise<Browser> | null = null
  private idle: NodeJS.Timeout | null = null
  // One card at a time, the others wait their turn
  private queue: Promise<unknown> = Promise.resolve()
  // A card asked twice while it is drawn is drawn once
  private drawing = new Map<string, Promise<Buffer>>()
  // A friend tapping through their stories asks for a card each time: their share is computed once for a while
  private shares = new Map<string, { until: number, share: ReturnType<WrappedService['share']> }>()

  constructor(private readonly wrappedService: WrappedService) {}

  async card(token: string, look: string, story: string) {
    if (!Object.hasOwn(WRAPPED_THEME_NAMES, look) || typeof story !== 'string' || !STORY.test(story)) {
      throw new BadRequestException()
    }

    const share = await this.shareOf(token)
    const looks = share.look.choice ? (share.look.looks || Object.keys(WRAPPED_THEME_NAMES)) : [share.look.theme]

    if (!looks.includes(look as WrappedTheme)) {
      throw new NotFoundException()
    }

    const day = new Date().toLocaleDateString('en-CA', { timeZone: TIME_ZONE })
    const key = createHash('sha256').update(JSON.stringify([token, look, story, day, share])).digest('hex')
    const file = join(FOLDER, `${key}.jpg`)
    const cached = await readFile(file).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error))

    if (cached) {
      return cached
    }

    if (!this.drawing.has(key)) {
      const drawn = this.queue.then(() => this.draw(token, look, story)).then(async (buffer) => {
        // The card is sent all the same, only the next ask draws it again
        await this.keep(file, buffer).catch((error) => this.logger.warn(`Card not kept: ${error.code || error.message}`))
        return buffer
      }).finally(() => this.drawing.delete(key))
      this.queue = drawn.catch(() => null)
      this.drawing.set(key, drawn)
    }

    return this.drawing.get(key)
  }

  private shareOf(token: string) {
    const now = Date.now()
    const kept = this.shares.get(token)

    if (kept && kept.until > now) {
      return kept.share
    }

    for (const [other, { until }] of this.shares) {
      until <= now && this.shares.delete(other)
    }

    const share = this.wrappedService.share(token)
    this.shares.set(token, { until: now + SHARE, share })
    share.catch(() => this.shares.delete(token))
    return share
  }

  private async draw(token: string, look: string, story: string) {
    const url = new URL(`/wrapped/${encodeURIComponent(token)}`, ORIGIN)
    url.search = new URLSearchParams({ card: story, look }).toString()
    let page: Page | null = null

    try {
      page = await (await this.open()).newPage()
      // The page only reaches its own origin: its chunks, its fonts, the API and the images it relays
      await page.setRequestInterception(true)
      page.on('request', (request) => new URL(request.url()).origin === url.origin ? request.continue() : request.abort())
      await page.setViewport(VIEWPORT)
      // The final state of every animation, the repaint of the posters included
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
      await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForSelector('html[data-card]', { timeout: 20000 })

      if (await page.$eval('html', (html) => html.dataset.card) !== 'ready') {
        throw new NotFoundException()
      }

      return Buffer.from(await page.screenshot({ type: 'jpeg', quality: 92 }))
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }

      // The token is in the address, it stays out of the logs
      this.logger.warn(`Card "${look}" "${story}" failed: ${error.name} ${error.message?.split('\n')[0].replaceAll(token, '<token>').replaceAll(encodeURIComponent(token), '<token>')}`)
      throw new ServiceUnavailableException()
    } finally {
      await page?.close().catch(() => null)
      this.sleep()
    }
  }

  private open() {
    this.idle && clearTimeout(this.idle)

    if (!this.browser) {
      const launched: Promise<Browser> = puppeteer.launch({
        executablePath: CHROMIUM,
        // It only opens the wrapped page, from the compose network; Alpine's Chromium times out on its
        // first protocol call with the GPU on
        args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio'],
      }).then((browser) => {
        // A browser that crashed or was killed is launched again for the next card
        browser.on('disconnected', () => this.browser === launched && (this.browser = null))
        return browser
      })
      launched.catch((error) => {
        this.logger.warn(`Chromium did not start: ${error.message?.split('\n')[0]}`)
        this.browser === launched && (this.browser = null)
      })
      this.browser = launched
    }

    return this.browser
  }

  private sleep() {
    this.idle && clearTimeout(this.idle)
    this.idle = setTimeout(() => this.close(), IDLE)
  }

  private async close() {
    const browser = this.browser
    this.browser = null
    await browser?.then((opened) => opened.close()).catch(() => null)
  }

  // Written for the next ask, the ones older than two days removed on the way
  private async keep(file: string, buffer: Buffer) {
    await mkdir(FOLDER, { recursive: true })
    await writeFile(file, buffer)
    const now = Date.now()

    for (const name of await readdir(FOLDER)) {
      const path = join(FOLDER, name)
      const { mtimeMs } = await stat(path).catch(() => ({ mtimeMs: now }))
      now - mtimeMs > KEEP && await rm(path, { force: true })
    }
  }

  async onModuleDestroy() {
    this.idle && clearTimeout(this.idle)
    await this.close()
  }
}
