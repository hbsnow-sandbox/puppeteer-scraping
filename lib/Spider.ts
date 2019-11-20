import puppeteer, { AuthOptions } from 'puppeteer'
import { Site, LinkInterface } from './Site'
import { writeLinks } from './file'

export interface SpiderOptionInterface {
  depth: number | null
  outputDir: string
}

export class Spider {
  private _auth: AuthOptions | null = null

  constructor(
    private _url: URL,
    private _site: Site,
    private _options: SpiderOptionInterface
  ) {
    if (_url.username && _url.password) {
      this._auth = {
        username: _url.username,
        password: _url.password,
      }
      _url.username = ''
      _url.password = ''
    }
  }

  /**
   * スクレイピングを実行する
   */
  async start() {
    let launchOptions = {}
    if (process.env.NODE_ENV === 'debug') {
      launchOptions = {
        ...launchOptions,
        slowMo: 300,
        headless: false,
      }
    }
    const browser = await puppeteer.launch(launchOptions)
    const page = await browser.newPage()
    await page.authenticate(this._auth)

    this._site.addList(this._url.href, 0)

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

  /**
   * リンクがもつリストから未登録状態のリンクを追加する
   * @param page
   * @param link
   */
  async nextScraping(page: puppeteer.Page, link: LinkInterface) {
    const links = await this.searchHrefFromPage(page, link)
    this._site.replaceLinks(link.href, links)

    const depth = link.depth + 1
    if (this._options.depth && depth >= this._options.depth) return

    links.forEach((link) => {
      this._site.addList(link.href, depth)
    })
  }

  /**
   * puppeteerでページを開いてリンク先が同一ホストのリンクを取得
   * @param page
   * @param link
   */
  async searchHrefFromPage(
    page: puppeteer.Page,
    link: LinkInterface
  ): Promise<URL[]> {
    const url = new URL(link.href)

    console.log(`Crawling: ${url.href}`)
    await page.goto(url.href, {
      waitUntil: ['domcontentloaded', 'networkidle2'],
    })

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
