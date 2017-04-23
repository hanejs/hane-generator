
import path from 'path'
import { fs } from '../utils'

async function NginxRedirectGenerator(context) {
  const { blogUrl } = context.blogUrl
  const { publicPath } = context.system

  let srule = ''
  for (const post of context.posts) {
    srule += `rewrite ^/archive/${post.wpId}/?$ ${blogUrl}${post.url} permanent;\n`
    srule += `rewrite ^/blog/po/${post.wpId}/?$ ${blogUrl}${post.url} permanent;\n`
  }
  for (const page of context.pages) {
    srule += `rewrite ^/${page.slug}/?$ ${blogUrl}${page.url} permanent;\n`
  }
  await fs.writeFileAsync(path.join(publicPath, 'rules.conf'), srule)
  return context
}

export default NginxRedirectGenerator
