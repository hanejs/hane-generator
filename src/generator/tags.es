
import path from 'path'
import { fs } from '../utils'

const PAGE_POSTS_COUNT = 10

async function TagsGenerator(context) {
  const theme = hane.runtime.theme

  for (const tag of context.tags) {
    tag.posts = context.posts.filter(post => post.tags && post.tags.includes(tag.name))
  }

  // generating tag index pages
  for (const tag of context.tags) {
    if (tag.posts.length > 0) {
      const pageCount = Math.ceil(tag.posts.length / PAGE_POSTS_COUNT)
      const publicPath = path.join(context.system.publicPath, tag.pagePath)
      const publicUrl = tag.url
      let page = 0
      while (page < pageCount) {
        page++
        const dirPath = page <= 1 ? publicPath : path.join(publicPath, 'page/' + page)
        await fs.ensureDirAsync(dirPath)
        const indexPath = path.join(dirPath, 'index.html')
        const start = (page - 1) * PAGE_POSTS_COUNT
        const html = await theme.render({
          blog: context.blog,
          title: page === 1 ? `Tag ${tag.name}` : `Tag ${tag.name} - Page ${page}`,
          activeTab: 'blog',
          tabs: context.tabs,
          posts: tag.posts.slice(start, start + PAGE_POSTS_COUNT),
          tags: context.tags,
          page,
          pageCount,
          prevUrl: page > 1 ? (page > 2 ? (publicUrl + 'page/' + (page - 1).toString()) : publicUrl) : null,
          nextUrl: page < pageCount ? (publicUrl + 'page/' + (page + 1).toString()) : null,
          links: context.links,
        }, 'index')
        await fs.writeFileAsync(indexPath, html)
      }
    }
  }

  return context
}

export default TagsGenerator
