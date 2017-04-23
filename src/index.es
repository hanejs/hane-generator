
import '../../hane'
import '../../hane-theme-simple'

import path from 'path'
import * as Generator from './generator'
import { fs } from './utils'

const ROOT_PATH = path.join(__dirname, '../..')
const SOURCE_PATH = path.join(ROOT_PATH, 'source')
const PUBLIC_PATH = path.join(ROOT_PATH, 'public')

// need read from hane-config
const BLOG_TITLE = 'hanejs'
const BLOG_PUBLIC = 'http://hane.io'
const PUBLIC_URL = '/'

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
  await getMetaInfo(context, 'comments')
  await readList(context, 'pages')
  await readList(context, 'posts')

  context.posts = context.posts.reverse()

  context.blog = {
    blogUrl: BLOG_PUBLIC,
    publicUrl: PUBLIC_URL,
    title: BLOG_TITLE,
    author: 'tengattack',
  }
  context.system = {
    sourcePath: SOURCE_PATH,
    publicPath: PUBLIC_PATH,
  }

  return context
}

read()
  .then(Generator.Url)
  .then(Generator.Content)
  .then(Generator.Pages)
  .then(Generator.Posts)
  //.then(Generator.Comments)
  .then(Generator.Atom)
  .then(Generator.Sitemap)
  .then(Generator.NginxRedirect)
  .catch(err => {
    console.log(err)
  })
