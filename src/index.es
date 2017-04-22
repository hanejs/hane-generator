
import '../../hane'
import '../../hane-theme-simple'

import path from 'path'
import Promise from 'bluebird'
import fsExtra from 'fs-extra'
import Generator from './generator'
import { getPagePath } from './utils'

const fs = Promise.promisifyAll(fsExtra)

const ROOT_PATH = path.join(__dirname, '../..')
const SOURCE_PATH = path.join(ROOT_PATH, 'source')
const PUBLIC_PATH = path.join(ROOT_PATH, 'public')

// need read from hane-config
const BLOG_NAME = 'hanejs'
const BLOG_PUBLIC = 'https://hane.io'
const PUBLIC_URL = '/'
const PAGE_POSTS_COUNT = 10

async function getMetaInfo(context, type) {
  try {
    context[type] = await fs.readJsonAsync(path.join(SOURCE_PATH, type + '.json'))
  } catch (e) {
    console.error(`read ${type} failed.`)
    console.error(e)
  }
}

async function readList(context, type) {
  try {
    const typePath = path.join(SOURCE_PATH, type)
    const files = await fs.readdirAsync(typePath)
    for (let fileName of files) {
      if (fileName.endsWith('.json')) {
        const filePath = path.join(typePath, fileName)
        try {
          const p = await fs.readJsonAsync(filePath)
          switch (p.type) {
          case 'html':
            p.content = await fs.readFileAsync(path.join(typePath, p.file), 'utf8')
            break
          }
          context[type].push(p)
        } catch (e) {
          console.error(`read ${type}/${fileName} failed.`)
          console.error(e)
        }
      }
    }
  } catch (e) {
    console.error(`read ${type} list failed.`)
    console.error(e)
  }
}

async function read() {
  const context = {
    posts: [],
    pages: [],
    links: [],
    tags: [],
  }

  await getMetaInfo(context, 'tags')
  await getMetaInfo(context, 'links')
  await readList(context, 'pages')
  await readList(context, 'posts')

  context.posts = context.posts.reverse()

  return context
}

async function generateUrl(context) {
  // generating urls
  for (const post of context.posts) {
    const pagePath = getPagePath(post.createTime, post.slug || post.title)
    post.pagePath = pagePath
    post.url = PUBLIC_URL + pagePath
  }

  // generating page urls
  for (const page of context.pages) {
    page.pagePath = (page.slug || page.title) + '/'
    page.url = PUBLIC_URL + page.pagePath
  }
  return context
}

async function generate(context) {
  const theme = hane.runtime.theme
  //await fs.ensureDirAsync(PUBLIC_PATH)

  const blog = { publicUrl: PUBLIC_URL, name: BLOG_NAME }

  // update content
  for (const post of context.posts) {
    // filter
    post.content = post.content.replace(/".*?\/wp-content(\/uploads\/.*?)"/ig, '"$1"')
    post.shortContent = theme.getShortIntroduction(post.content)
  }
  for (const page of context.pages) {
    // filter
    page.content = page.content.replace(/".*?\/wp-content(\/uploads\/.*?)"/ig, '"$1"')
  }

  // generating post pages
  const pageCount = Math.ceil(context.posts.length / PAGE_POSTS_COUNT)
  let page = 0
  while (page < pageCount) {
    page++
    const dirPath = page <= 1 ? PUBLIC_PATH : path.join(PUBLIC_PATH, 'page/' + page)
    await fs.ensureDirAsync(dirPath)
    const indexPath = path.join(dirPath, 'index.html')
    const start = (page - 1) * PAGE_POSTS_COUNT
    const html = await theme.render({
      blog,
      title: page === 1 ? 'Index' : `Page ${page}`,
      posts: context.posts.slice(start, start + PAGE_POSTS_COUNT),
      tags: context.tags,
      page,
      pageCount,
      prevUrl: page > 1 ? (page > 2 ? (PUBLIC_URL + 'page/' + (page - 1).toString()) : PUBLIC_URL) : null,
      nextUrl: page < pageCount ? (PUBLIC_URL + 'page/' + (page + 1).toString()) : null,
    }, 'index')
    await fs.writeFileAsync(indexPath, html)
  }

  // generating posts
  for (const post of context.posts) {
    const dirPath = path.join(PUBLIC_PATH, post.pagePath)
    await fs.ensureDirAsync(dirPath)
    const indexPath = path.join(dirPath, 'index.html')
    const html = await theme.render({
      blog,
      title: post.title,
      posts: context.posts,
      tags: context.tags,
      post,
    }, 'item')
    await fs.writeFileAsync(indexPath, html)
  }

  // generating pages
  for (const page of context.pages) {
    const dirPath = path.join(PUBLIC_PATH, page.pagePath)
    await fs.ensureDirAsync(dirPath)
    const indexPath = path.join(dirPath, 'index.html')
    const html = await theme.render({
      blog,
      title: page.title,
      posts: context.pages,
      tags: context.tags,
      post: page,
    }, 'item')
    await fs.writeFileAsync(indexPath, html)
  }

  return context
}

async function generateNginxRedirect(context) {
  let srule = ''
  for (const post of context.posts) {
    srule += `rewrite ^/archive/${post.wpId}/?$ ${BLOG_PUBLIC}${post.url} permanent;\n`
    srule += `rewrite ^/blog/po/${post.wpId}/?$ ${BLOG_PUBLIC}${post.url} permanent;\n`
  }
  for (const page of context.pages) {
    srule += `rewrite ^/${page.slug}/?$ ${BLOG_PUBLIC}${page.url} permanent;\n`
  }
  await fs.writeFileAsync(path.join(PUBLIC_PATH, 'rules.conf'), srule)
  return context
}

async function generateSitemap(context) {
  let sxml =`<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
<!-- generated by hanejs -->
`
  for (const post of context.posts) {
    sxml += `<url>
  <loc>${BLOG_PUBLIC}${post.url}</loc>
  <lastmod>${post.updateTime}</lastmod>
</url>
`
  }

  for (const page of context.pages) {
    sxml += `<url>
  <loc>${BLOG_PUBLIC}${page.url}</loc>
  <lastmod>${page.updateTime}</lastmod>
</url>
`
  }

  sxml += '</urlset>'
  await fs.writeFileAsync(path.join(PUBLIC_PATH, 'sitemap.xml'), sxml)
  return context
}

read()
  .then(generateUrl)
  .then(generate)
  .then(generateSitemap)
  //.then(generateNginxRedirect)
  .catch(err => {
    console.log(err)
  })
