
async function ContentGenerator(context) {
  const theme = hane.runtime.theme
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
  return context
}

export default ContentGenerator
