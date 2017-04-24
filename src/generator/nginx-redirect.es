
import path from 'path'
import { fs } from '../utils'

async function NginxRedirectGenerator(context) {
  const { blogUrl, publicUrl } = context.blog
  const { publicPath } = context.system

  let srule = ''
  for (const post of context.posts) {
    srule += `rewrite ^/archive/${post.wpId}/?$ ${blogUrl}${post.url} permanent;\n`
    srule += `rewrite ^/blog/po/${post.wpId}/?$ ${blogUrl}${post.url} permanent;\n`
  }
  for (const page of context.pages) {
    srule += `rewrite ^/${page.slug}/?$ ${blogUrl}${page.url} permanent;\n`
  }

  srule += `rewrite ^/feed/?$ ${blogUrl}${publicUrl}atom.xml permanent;\n`
  srule += `rewrite ^/feed/atom/?$ ${blogUrl}${publicUrl}atom.xml permanent;\n`
  srule += `rewrite ^/blog/feed/?$ ${blogUrl}${publicUrl}atom.xml permanent;\n`
  srule += `rewrite ^/blog/feed/atom/?$ ${blogUrl}${publicUrl}atom.xml permanent;\n`

  await fs.writeFileAsync(path.join(publicPath, 'rules.conf'), srule)
  return context
}

export default NginxRedirectGenerator
