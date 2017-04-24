
import path from 'path'
import { fs, ii, getTimeGMTString, htmlEncode } from '../utils'

function filter(data) {
  //const thread_ids = new Set(data.posts.map(p => p.thread_id))
  //data.threads = data.threads.filter(t => t.thread_key && thread_ids.has(t.thread_id))
  /*data.posts.forEach(post => {
    if (post.parents && post.parents.length) {
      post.parent_id = post.parents[post.parents.length - 1]
    } else {
      post.parent_id = null
    }
  })*/
  return data
}

function getComments(data, post) {
  const thread = post.wpId
               ? data.threads.filter(t => t.thread_key == post.wpId)[0]
               : data.threads.filter(t => t.url.endsWith('/' + post.slug))[0]
  if (!thread) {
    console.log(post.title, 'not found')
  }
  const comments = thread
                 ? data.posts.filter(p => (p.thread_id == thread.thread_id && p.message && p.message.length > 1))
                 : []
  const parent_ids = new Set(comments.map(c => c.post_id))
  parent_ids.delete(null)
  comments.forEach(c => {
    if (c.parents && c.parents.length) {
      for (let i = c.parents.length - 1; i >= 0; i--) {
        const parent_id = c.parents[i]
        if (parent_ids.has(parent_id)) {
          c.parent_id = parent_id
          break
        }
      }
      if (!c.parent_id) {
        console.log(post.title, '<-x-', c.message)
      }
    } else {
      c.parent_id = null
    }
  })
  return comments
}

function getItemXML(blog, post, post_date, comments) {
  let xml = `
  <item>
    <title>${htmlEncode(post.title)}</title>
    <link>${blog.blogUrl}${post.url}</link>
    <wp:content></wp:content>
    <dsq:thread_identifier>${post.slug}</dsq:thread_identifier>
    <wp:post_date_gmt>${getTimeGMTString(post_date)}</wp:post_date_gmt>
    <wp:comment_status>open</wp:comment_status>`
  for (const c of comments) {
    const cd = new Date(c.created_at)
    xml += `
    <wp:comment>
      <wp:comment_id>${c.post_id}</wp:comment_id>
      <wp:comment_author>${c.author_name}</wp:comment_author>
      <wp:comment_author_email>${c.author_email}</wp:comment_author_email>
      <wp:comment_author_url>${c.author_url}</wp:comment_author_url>
      <wp:comment_author_IP>${c.ip}</wp:comment_author_IP>
      <wp:comment_date_gmt>${getTimeGMTString(cd)}</wp:comment_date_gmt>
      <wp:comment_content><![CDATA[${c.message}]]></wp:comment_content>
      <wp:comment_approved>1</wp:comment_approved>
      <wp:comment_parent>${c.parent_id || ''}</wp:comment_parent>
    </wp:comment>`
  }
  xml += `
  </item>`
  return xml
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
    const comments = getComments(allComments, post)
    xml += getItemXML(blog, post, d, comments)
  }
  for (const page of context.pages) {
    const d = new Date(page.createTime)
    const comments = getComments(allComments, page)
    xml += getItemXML(blog, page, d, comments)
  }
  xml += `
  </channel>
</rss>`

  await fs.writeFileAsync(path.join(publicPath, 'disqus.xml'), xml)
  return context
}

export default CommentsGenerator
