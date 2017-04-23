
import path from 'path'
import { fs, htmlEncode } from '../utils'

const ATOM_MAX_POST = 20

async function AtomGenerator(context) {
  const { blog } = context
  const { publicPath } = context.system

  const fullPublicUrl = blog.blogUrl + blog.publicUrl
  const d = new Date()

  let xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${htmlEncode(blog.title)}</title>
  <subtitle>${htmlEncode(blog.subtitle)}</subtitle>
  <link href="${blog.publicUrl}atom.xml" rel="self" />

  <link href="${fullPublicUrl}" />
  <updated>${d.toISOString()}</updated>
  <id>${fullPublicUrl}</id>

  <author>
    <name>${htmlEncode(blog.author)}</name>
  </author>

  <generator uri="http://hane.io/">hanejs</generator>
`
  let i = 0
  for (const post of context.posts) {
    const postUrl = blog.blogUrl + post.url
    xml += `
  <entry>
    <title>${htmlEncode(post.title)}</title>
    <link href="${postUrl}" />
    <id>${postUrl}</id>
    <published>${post.createTime}</published>
    <updated>${post.updateTime}</updated>

    <content type="html"><![CDATA[${post.content}]]></content>
    <summary type="html"><![CDATA[${post.shortContent}]]></summary>
`
    if (post.tags) {
      const tags = context.tags.filter(t => post.tags.includes(t.name))
      for (const tag of tags) {
        xml += `
    <category term="${htmlEncode(tag.name)}" scheme="${blog.blogUrl}${tag.url}" />`
      }
    }
    xml += `
  </entry>`

    // counting
    i++
    if (i >= ATOM_MAX_POST) {
      break
    }
  }

  xml += `
</feed>
`
  await fs.writeFileAsync(path.join(publicPath, 'atom.xml'), xml)
  return context
}

export default AtomGenerator
