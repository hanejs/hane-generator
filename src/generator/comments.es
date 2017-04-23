
import path from 'path'
import { fs, ii, getTimeGMTString, htmlEncode } from '../utils'

const deleteKeys = [ 'delete', 'delete-forever', 'spam' ]

function filter(data) {
  const dcs = new Set(
                data.filter(c => deleteKeys.includes(c.action))
                    .reduce((p, c) => [ ...p, ...c.meta ], [])
              )
  const comments = data.filter(c => (c.action === 'create'
                                      && !dcs.has(c.meta.post_id)
                                      && c.meta.status === 'approved'
                                    ))
  return comments
}


async function CommentsGenerator(context) {
  const blog = context.blog
  const { publicPath } = context.system
  const allComments = filter(context.comments)

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dsq="http://www.disqus.com/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.0/"
>
  <channel>`
  for (const post of context.posts) {
    const d = new Date(post.createTime)
    const comments = allComments.filter(c => c.meta.thread_key == post.wpId)
    xml += `
    <item>
      <title>${htmlEncode(post.title)}</title>
      <link>${blog.blogUrl}${post.url}</link>
      <wp:content></wp:content>
      <dsq:thread_identifier>${post.slug}</dsq:thread_identifier>
      <wp:post_date_gmt>${getTimeGMTString(d)}</wp:post_date_gmt>
      <wp:comment_status>open</wp:comment_status>`
    for (const c of comments) {
      const cd = new Date(c.meta.created_at)
      xml += `
      <wp:comment>
        <wp:comment_id>${c.meta.post_id}</wp:comment_id>
        <wp:comment_author>${c.meta.author_name}</wp:comment_author>
        <wp:comment_author_email>${c.meta.author_email}</wp:comment_author_email>
        <wp:comment_author_url>${c.meta.author_url}</wp:comment_author_url>
        <wp:comment_author_IP>${c.meta.ip}</wp:comment_author_IP>
        <wp:comment_date_gmt>${getTimeGMTString(cd)}</wp:comment_date_gmt>
        <wp:comment_content><![CDATA[${c.meta.message}]]></wp:comment_content>
        <wp:comment_approved>1</wp:comment_approved>
        <wp:comment_parent>${c.meta.parent_id}</wp:comment_parent>
      </wp:comment>`
    }
    xml += `
    </item>`
  }
  xml += `
  </channel>
</rss>`

  await fs.writeFileAsync(path.join(publicPath, 'disqus.xml'), xml)
  return context
}

export default CommentsGenerator
