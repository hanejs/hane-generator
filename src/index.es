
import hane from '../../hane'
import '../../hane-theme-simple'

import path from 'path'
import Promise from 'bluebird'
import fsExtra from 'fs-extra'
import Generator from './generator'

const fs = Promise.promisifyAll(fsExtra)

const ROOT_PATH = path.join(__dirname, '../..')
const SOURCE_PATH = path.join(ROOT_PATH, 'source')

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

read()
  .then(context => {
    context.pages
  })
  .catch(err => {
    console.log(err)
  })
