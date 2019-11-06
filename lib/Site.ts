enum LinkState {
  Waiting,
  Searching,
  Searched,
}

export interface LinkInterface {
  href: string
  state: LinkState
  depth: number
  urls: URL[]
}

export class Site {
  private _list: LinkInterface[] = []

  get list() {
    return this._list
  }

  /**
   * リンクのリストに検索待ち状態で追加する
   * @param href
   * @param depth
   */
  addList(href: string, depth: number) {
    const url = new URL(href)
    if (this._list.some((link) => link.href === url.href)) return
    this._list.push({
      href,
      state: LinkState.Waiting,
      depth,
      urls: [],
    })
  }

  /**
   * すべてのリンクを検索し終えているか
   */
  isFinishedAll(): boolean {
    return this._list.every((link) => link.state === LinkState.Searched)
  }

  /**
   * 検索していないリンクを探して戻す
   */
  searchWaitingLink(): LinkInterface | undefined {
    return this._list.find((link) => link.state === LinkState.Waiting)
  }

  /**
   * LinkInterfaceのurlsを置き換える
   * @param href 置き換えたいリンク
   * @param urls 置き換えるページ内のリンク
   */
  replaceLinks(href: string, urls: URL[]) {
    this._list.map((link) => {
      if (link.href !== href) return link
      link.urls = urls
      link.state = LinkState.Searched
      return link
    })
  }

  /**
   * 異なるホストのURLを除外する
   * @param urls
   * @param host
   */
  async exceptDifferentHost(urls: string[], host: string): Promise<URL[]> {
    return urls.reduce((acc: URL[], current: string) => {
      const currentUrl = new URL(current)
      return currentUrl.host === host ? [...acc, currentUrl] : acc
    }, [])
  }
}
