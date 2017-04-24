
import path from 'path'
import { fs } from '../utils'

const PAGE_POSTS_COUNT = 10

async function PostPagesGenerator(context) {
  const theme = hane.runtime.theme
  const { publicUrl } = context.blog
  const { publicPath } = context.system

  // generating post pages
  const pageCount = Math.ceil(context.posts.length / PAGE_POSTS_COUNT)
  let page = 0
  while (page < pageCount) {
    page++
    const dirPath = page <= 1 ? publicPath : path.join(publicPath, 'page/' + page)
    await fs.ensureDirAsync(dirPath)
    const indexPath = path.join(dirPath, 'index.html')
    const start = (page - 1) * PAGE_POSTS_COUNT
    const html = await theme.render({
      blog: context.blog,
      title: page === 1 ? 'Index' : `Page ${page}`,
      activeTab: 'blog',
      tabs: context.tabs,
      posts: context.posts.slice(start, start + PAGE_POSTS_COUNT),
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

async function PostsGenerator(context) {
  await PostPagesGenerator(context)

  const theme = hane.runtime.theme
  const { publicPath } = context.system

  // generating posts
  for (const post of context.posts) {
    const dirPath = path.join(publicPath, post.pagePath)
    await fs.ensureDirAsync(dirPath)
    const indexPath = path.join(dirPath, 'index.html')
    const html = await theme.render({
      blog: context.blog,
      title: post.title,
      activeTab: 'blog',
      tabs: context.tabs,
      tabs: context.tabs,
      posts: context.posts,
      tags: context.tags,
      post,
      links: context.links,
    }, 'item')
    await fs.writeFileAsync(indexPath, html)
  }

  return context
}

export default PostsGenerator
