import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { lookup } from 'node:dns/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import puppeteer, { Browser, BrowserContext } from 'puppeteer-core'
import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common'
import { WRAPPED_THEME_NAMES, WRAPPED_TIME_ZONE as TIME_ZONE, WrappedTheme } from '@sensorr/sensorr'
import { WrappedService } from './wrapped.service'

// Every story is composed at 396 × 704 and shared at 1080 × 1920: whole CSS pixels at both sizes, a capture rounds to them
const VIEWPORT = { width: 396, height: 704, deviceScaleFactor: 1080 / 396 }
// A story's name in the address: `opening`, `figure-twin`, `summary`; the page says when it has none
const STORY = /^[a-z]{1,16}(?:-[a-z_]{1,16})?$/
// The wrapped page the browser opens, served with the API behind it: `sensorr-web` in the compose stack
const ORIGIN = process.env.NX_WRAPPED_URL || 'http://sensorr-web'
// The `sensorr-chromium` container of the compose stack, which has software WebGL for the Affiche's paint;
// without it, a Chromium installed here is launched, as in development
const REMOTE = process.env.NX_CHROMIUM_URL
const CHROMIUM = process.env.NX_CHROMIUM_PATH
const FOLDER = join(tmpdir(), 'sensorr-cards')
// A card is drawn again each day, its date and figures move; older files are removed
const KEEP = 2 * 24 * 3600 * 1000
// The browser closes, or is let go, after this long without a card to draw
const IDLE = 60 * 1000
const SHARE = 5 * 60 * 1000
// Cards drawn at once, by one friend and in all: past it the friend is asked to try again
const BUSY = { token: 3, all: 24 }
// The folder never grows past this, the oldest cards go first
const SIZE = 512 * 1024 * 1024

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
  private busy = new Map<string, number>()

  constructor(private readonly wrappedService: WrappedService) {}

  async card(token: string, look: string, story: string, year?: number) {
    if (!Object.hasOwn(WRAPPED_THEME_NAMES, look) || typeof story !== 'string' || !STORY.test(story)) {
      throw new BadRequestException()
    }

    const share = await this.shareOf(token, year)
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
      if ((this.busy.get(token) || 0) >= BUSY.token || this.drawing.size >= BUSY.all) {
        throw new ServiceUnavailableException()
      }

      this.busy.set(token, (this.busy.get(token) || 0) + 1)
      const drawn = this.queue.then(() => this.draw(token, share.year, look, story)).then(async (buffer) => {
        // The card is sent all the same, only the next ask draws it again
        await this.keep(file, buffer).catch((error) => this.logger.warn(`Card not kept: ${error.code || error.message}`))
        return buffer
      }).finally(() => {
        this.drawing.delete(key)
        const busy = (this.busy.get(token) || 1) - 1
        busy ? this.busy.set(token, busy) : this.busy.delete(token)
      })
      this.queue = drawn.catch(() => null)
      this.drawing.set(key, drawn)
    }

    return this.drawing.get(key)
  }

  private shareOf(token: string, year?: number) {
    const now = Date.now()
    const id = `${token}:${year ?? ''}`
    const kept = this.shares.get(id)

    if (kept && kept.until > now) {
      return kept.share
    }

    for (const [other, { until }] of this.shares) {
      until <= now && this.shares.delete(other)
    }

    const share = this.wrappedService.share(token, year)
    this.shares.set(id, { until: now + SHARE, share })
    share.catch(() => this.shares.delete(id))
    return share
  }

  private async draw(token: string, year: number, look: string, story: string) {
    const url = new URL(`/wrapped/${encodeURIComponent(token)}/${year}`, ORIGIN)
    url.search = new URLSearchParams({ card: story, look }).toString()
    let context: BrowserContext | null = null

    try {
      // A context of its own per card: nothing a friend's page stored is there for the next one
      context = await (await this.open()).createBrowserContext()
      const page = await context.newPage()
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
      await context?.close().catch(() => null)
      this.sleep()
    }
  }

  private open() {
    this.idle && clearTimeout(this.idle)

    if (!this.browser) {
      const launched: Promise<Browser> = (REMOTE ? this.connect(REMOTE) : puppeteer.launch({
        executablePath: CHROMIUM,
        // Through a pipe rather than a debugging port: Chromium also quits when the API does
        pipe: true,
        // Puppeteer's own signal handlers would keep the API from stopping on SIGTERM
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false,
        args: ['--hide-scrollbars', '--mute-audio'],
      })).then((browser) => {
        // A browser that crashed or was killed is launched again for the next card
        browser.on('disconnected', () => this.browser === launched && (this.browser = null))
        return browser
      })
      launched.catch((error) => {
        this.logger.warn(`Chromium unreachable: ${error.message?.split('\n')[0]}`)
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

  // DevTools answers a Host that is an address or `localhost`, never a container's name
  private async connect(remote: string) {
    const url = new URL(remote)
    url.hostname = (await lookup(url.hostname, { family: 4 })).address
    return puppeteer.connect({ browserURL: url.toString() })
  }

  private async close() {
    const browser = this.browser
    this.browser = null
    await browser?.then((opened) => REMOTE ? opened.disconnect() : opened.close()).catch(() => null)
  }

  // Written for the next ask, the ones older than two days removed on the way
  private async keep(file: string, buffer: Buffer) {
    await mkdir(FOLDER, { recursive: true })
    await writeFile(file, buffer)
    const now = Date.now()

    const files = await Promise.all((await readdir(FOLDER)).map(async (name) => {
      const path = join(FOLDER, name)
      const { mtimeMs, size } = await stat(path).catch(() => ({ mtimeMs: now, size: 0 }))
      return { path, mtimeMs, size }
    }))
    let total = files.reduce((sum, { size }) => sum + size, 0)

    for (const { path, mtimeMs, size } of files.sort((a, b) => a.mtimeMs - b.mtimeMs)) {
      if (now - mtimeMs > KEEP || total > SIZE) {
        await rm(path, { force: true })
        total -= size
      }
    }
  }

  async onModuleDestroy() {
    this.idle && clearTimeout(this.idle)
    await this.close()
  }
}
