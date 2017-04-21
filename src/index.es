
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

  return context
}

async function generate(context) {
  const theme = hane.runtime.theme
  await fs.ensureDirAsync(PUBLIC_PATH)

  // generating urls
  for (const post of context.posts) {
    const pagePath = getPagePath(post.create_time, post.slug || post.title)
    post.url = pagePath
  }

  // generating pages
  for (const post of context.posts) {
    const dirPath = path.join(PUBLIC_PATH, post.url)
    await fs.ensureDirAsync(dirPath)
    const indexPath = path.join(dirPath, 'index.html')
    const html = await theme.render({
      items: [ post.content ],
      tags: context.tags,
    }, 'item')
    await fs.writeFileAsync(indexPath, html)
  }
}

read()
  .then(generate)
  .catch(err => {
    console.log(err)
  })
