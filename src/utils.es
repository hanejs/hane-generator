
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
