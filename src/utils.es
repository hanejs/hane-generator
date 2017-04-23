
import fsExtra from 'fs-extra'
import Promise from 'bluebird'

export const fs = Promise.promisifyAll(fsExtra)

export function ii(s, len = 2, pad = '0') {
  s = s.toString()
  while (s.length < len) {
    s = pad + s
  }
  return s
}

export function getPagePath(d, slug) {
  d = new Date(d)
  return `${d.getFullYear()}/${ii(d.getMonth() + 1)}/${ii(d.getDate())}/${slug}/`
}

export function getTimeGMTString(d) {
  // YYYY-MM-DD HH:MM:SS
  return `${d.getUTCFullYear()}-${ii(d.getUTCMonth() + 1)}-${ii(d.getUTCDate())}`
          + ` ${ii(d.getUTCHours())}:${ii(d.getUTCMinutes())}:${ii(d.getUTCSeconds())}`
}

export function htmlEncode(str) {
  if (!str) {
    str = ''
  }
  return str.replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
}
