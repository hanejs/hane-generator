
import { getPagePath } from '../utils'

async function UrlGenerator(context) {
  const { publicUrl } = context.blog

  // generating urls
  for (const post of context.posts) {
    const pagePath = getPagePath(post.createTime, post.slug || post.title)
    post.pagePath = pagePath
    post.url = publicUrl + pagePath
  }

  // generating page urls
  for (const page of context.pages) {
    page.pagePath = (page.slug || page.title) + '/'
    page.url = publicUrl + page.pagePath
  }

  // generating tag urls
  for (const tag of context.tags) {
    tag.pagePath = (tag.slug || tag.name) + '/'
    tag.url = publicUrl + 'tags/' + tag.pagePath
  }

  return context
}

export default UrlGenerator
