

import path from 'path'
import { fs } from '../utils'

async function PagesGenerator(context) {
  const theme = hane.runtime.theme
  const { publicPath } = context.system

  // generating pages
  for (const page of context.pages) {
    const dirPath = path.join(publicPath, page.pagePath)
    await fs.ensureDirAsync(dirPath)
    const indexPath = path.join(dirPath, 'index.html')
    const html = await theme.render({
      blog: context.blog,
      title: page.title,
      posts: context.pages,
      tags: context.tags,
      post: page,
    }, 'item')
    await fs.writeFileAsync(indexPath, html)
  }

  return context
}

export default PagesGenerator
