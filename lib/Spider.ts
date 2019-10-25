import puppeteer from 'puppeteer'
import { Site, LinkInterface } from './Site'
import { writeLinks } from './file'

export interface SpiderOptionInterface {
  depth: number | null
  outputDir: string
}

export interface BasicAuthInterface {
  username: string
  password: string
}

export class Spider {
  private _auth: BasicAuthInterface | null = null

  constructor(private _url: URL, private _site: Site, private _options: SpiderOptionInterface) {}

  set auth(auth: BasicAuthInterface | null) {
    this._auth = auth
  }

  get auth(): BasicAuthInterface | null {
    if (!this._auth) return null

    return this._auth
  }

  async start() {
    const browser = await puppeteer.launch({
      ignoreHTTPSErrors: true,
    })
    const page = await browser.newPage()

    this._site.addWaitingList(this._url.href, 0)

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const nextWaitingUrl = this._site.searchWaitingLink()
      if (nextWaitingUrl) {
        await this.nextScraping(page, nextWaitingUrl)
      } else if (this._site.isFinishedAll()) {
        break
      } else {
        await new Promise((cb) => setTimeout(cb, 1000))
      }
    }

    writeLinks(this._site.list, `${this._options.outputDir}/hrefs.json`)

    await browser.close()
  }

  async nextScraping(page: puppeteer.Page, link: LinkInterface) {
    const links = await this.searchHrefFromPage(page, link)
    this._site.replaceLinks(link.href, links)

    const depth = link.depth + 1
    if (this._options.depth && depth >= this._options.depth) return

    links.forEach((link) => {
      this._site.addWaitingList(link.href, depth)
    })
  }

  async searchHrefFromPage(page: puppeteer.Page, link: LinkInterface): Promise<URL[]> {
    const url = new URL(link.href)
    if (this._auth) {
      url.username = this._auth.username
      url.password = this._auth.password
    }

    await page.goto(url.href)

    const urls = await page.evaluate(() => {
      const $hrefs = document.querySelectorAll('a')
      const hrefs: string[] = []
      $hrefs.forEach(($e) => {
        if ($e.href) {
          const url = new URL($e.href)
          url.hash = ''
          url.search = ''
          hrefs.push(url.href)
        }
      })
      return Array.from(new Set(hrefs))
    })

    return this._site.exceptDifferentHost(urls, this._url.host)
  }
}
