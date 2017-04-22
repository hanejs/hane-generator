
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

const PUBLIC_URL = '/'
const PAGE_POSTS_COUNT = 20

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

async function generate(context) {
  const theme = hane.runtime.theme
  //await fs.ensureDirAsync(PUBLIC_PATH)

  // generating urls
  for (const post of context.posts) {
    const pagePath = getPagePath(post.create_time, post.slug || post.title)
    post.pagePath = pagePath
    post.url = PUBLIC_URL + pagePath
    post.shortContent = theme.getShortIntroduction(post.content)
  }

  // generating pages
  const pageCount = Math.ceil(context.posts.length / PAGE_POSTS_COUNT)
  let page = 0
  while (page < pageCount) {
    page++
    const dirPath = page <= 1 ? PUBLIC_PATH : path.join(PUBLIC_PATH, 'page/' + page)
    await fs.ensureDirAsync(dirPath)
    const indexPath = path.join(dirPath, 'index.html')
    const start = (page - 1) * PAGE_POSTS_COUNT
    const html = await theme.render({
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
      posts: context.posts,
      tags: context.tags,
      post,
    }, 'item')
    await fs.writeFileAsync(indexPath, html)
  }
}

read()
  .then(generate)
  .catch(err => {
    console.log(err)
  })
