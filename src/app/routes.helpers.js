import { matchPath } from 'react-router-dom'
import { routeDefs } from './routes'

export function matchRouteDefinition(pathname) {
  for (const [pattern, def] of Object.entries(routeDefs)) {
    const hit = matchPath({ path: pattern, end: true }, pathname)
    if (hit) return { pattern, params: hit.params ?? {}, ...def }
  }
  return null
}
