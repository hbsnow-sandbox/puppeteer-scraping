import yargs from 'yargs'
import { Site } from './Site'
import { Spider, SpiderOptionInterface } from './Spider'

const argv = yargs.options({
  h: { type: 'string', alias: 'href' },
  d: { type: 'number', alias: 'depth' },
  o: { type: 'string', alias: 'outputDir' },
}).argv

const init = async () => {
  if (!argv.h) {
    throw new Error('--hrefが指定されていません、このパラメータは必須です')
  }

  const options: SpiderOptionInterface = {
    depth: argv.d || null,
    outputDir: argv.o || 'output',
  }

  const url = new URL(argv.h)
  const site = new Site()
  const spider = new Spider(url, site, options)

  spider.start()
}

init()
