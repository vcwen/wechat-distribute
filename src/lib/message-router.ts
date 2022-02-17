import { Dispatcher } from './dispatcher'
import { Route } from './route'

export interface ConfigRoute {
  primary?: string
  secondary?: string[]
  exclude?: string[]
  routes?: { [key: string]: ConfigRoute }
}
export class MessageRouter {
  public appId: string
  private routes: Route[] = []
  constructor(appId: string, routerInfo: ConfigRoute, dispatchers: Map<string, Dispatcher>) {
    this.appId = appId
    this.setupRoutes('*', routerInfo, undefined, dispatchers)
    console.log(this.routes)
  }
  public getTargetClients(topic: string): [string, Set<string>] {
    const route = this.getMatchedRoute(topic)
    return this.getTargetsRecursively(route, new Set())
  }
  private validateRoute(route: Route, clients: Map<string, Dispatcher>) {
    if (route.primary) {
      if (!clients.has(route.primary)) {
        throw new Error(`topic:${route.topic} invalid primary target:${route.primary}`)
      }
    }
    if (route.secondary) {
      route.secondary.forEach((item, index) => {
        if (!clients.has(item)) {
          throw new Error(`topic:${route.topic} invalid secondary target:[${index}]${item}`)
        }
      })
    }
    if (route.exclude) {
      route.exclude.forEach((item, index) => {
        if (!clients.has(item)) {
          throw new Error(`topic:${route.topic} invalid exclude target:[${index}]${item}`)
        }
      })
    }
  }
  private setupRoutes(topic: string, configRoute: ConfigRoute, parent: Route, dispatchers: Map<string, Dispatcher>) {
    const route = new Route(topic, configRoute.primary, configRoute.secondary, configRoute.exclude, parent)
    this.validateRoute(route, dispatchers)
    this.routes.push(route)
    if (configRoute.routes) {
      const keys = Object.keys(configRoute.routes)
      keys.forEach((key) => {
        const subTopic = topic === '*' ? key : [topic, key].join('.')
        this.setupRoutes(subTopic, configRoute.routes[key], route, dispatchers)
      })
    }
  }
  private getMatchedRoute(topic: string): Route {
    const segments = topic.split('.')
    while (segments.length > 0) {
      const currentTopic = segments.join('.')
      const matchedRoute = this.routes.find((item) => item.topic === currentTopic)
      if (matchedRoute) {
        return matchedRoute
      }
      // go to upper level route
      segments.pop()
    }
    return this.getDefaultRoute()
  }
  private getDefaultRoute(): Route {
    return this.routes.find((item) => item.topic === '*')
  }

  private getTargetsRecursively(route: Route, exclude: Set<string>): [string, Set<string>] {
    let primary = route.primary
    let secondary = new Set<string>(route.secondary ? route.secondary.filter((item) => !exclude.has(item)) : [])
    if (route.parent) {
      let [parentPrimary, parentSecondary] = this.getTargetsRecursively(
        route.parent,
        new Set<string>([...exclude, ...route.exclude])
      )
      if (parentPrimary && parentSecondary.size > 0) {
        secondary = new Set([...secondary, ...parentSecondary])
      }
      if (parentPrimary) {
        if (primary) {
          secondary.add(primary)
        } else {
          primary = parentPrimary
        }
      }
    }
    return [primary, secondary]
  }
}
