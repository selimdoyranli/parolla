export default ({ route, redirect, localePath }) => {
  if (route.path.startsWith('/room') && route.query.id) {
    redirect(localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: route.query.id } }))
  }

  if ((route.path.startsWith('/oda') && route.query.id) || (route.path.startsWith('/en/room') && route.query.id)) {
    redirect(localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: route.query.id } }))
  }

  if (route.path.endsWith('/') && route.path !== '/') {
    redirect(route.path.slice(0, -1))
  }
}
