
async function TabsGenerator(context) {
  const { blog } = context
  const tabs = [ { title: 'Blog', slug: 'blog', url: blog.publicUrl } ]
  context.pages.forEach(p => {
    if (!p.slug || p.slug.includes('/')) {
      return
    }
    tabs.push(p)
  })
  context.tabs = tabs
  return context
}

export default TabsGenerator
