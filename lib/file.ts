import fs from 'fs'
import { LinkInterface } from './Site'

/**
 * リンク一覧の配列を出力する
 * @param links
 * @param file
 */
export const writeLinks = async (
  links: LinkInterface[],
  file: string
): Promise<void> => {
  const hrefs: string[] = links.reduce((acc: string[], current) => {
    acc.push(current.href)
    return acc
  }, [])

  await fs.promises.writeFile(file, JSON.stringify(hrefs, null, '  '), 'utf-8')
}
