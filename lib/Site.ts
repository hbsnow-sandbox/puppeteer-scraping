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

  addWaitingList(href: string, depth: number) {
    const url = new URL(href)

    if (this._list.some((link) => link.href === url.href)) return
    this._list.push({
      href,
      state: LinkState.Waiting,
      depth,
      urls: [],
    })
  }

  isFinishedAll(): boolean {
    return this._list.every((link) => link.state === LinkState.Searched)
  }

  searchWaitingLink(): LinkInterface | undefined {
    return this._list.find(
      (link) => link.state === LinkState.Waiting
    )
  }

  replaceLinks(href: string, urls: URL[]) {
    this._list.map((link) => {
      if (link.href !== href) return link
      link.urls = urls
      link.state = LinkState.Searched
      return link
    })
  }

  async exceptDifferentHost(urls: string[], host: string): Promise<URL[]> {
    return urls.reduce((acc: URL[], current: string) => {
      const currentUrl = new URL(current)

      return currentUrl.host === host
        ? [...acc, currentUrl]
        : acc
    }, [])
  }
}
