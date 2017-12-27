import {List, Set} from 'immutable'
import {Message} from '../model/Message'
import Route from '../model/Route'
import { Priority } from './Constants'

class ClientRouter {
  private routes: List<Route>

  constructor(routes: List<Route>) {
    this.routes = routes
  }
  public getClients(message: Message): [string, Set<string>] {
    const phaseList = List.of(...message.getPhases())
    const excludes = Set.of(...this.getExcludeRoutes(phaseList).map((item) => item.url))
    const primary = this.getPrimaryRoute(phaseList, excludes).url
    const secondaries = Set.of(...this.getSecondaryRoutes(phaseList, excludes).map((item) => item.url))
      .filterNot((url) => url === primary)
    return [primary, secondaries]
  }
  private getPrimaryRoute(phases: List<string>, excludes: Set<string>): Route {
    if (phases.isEmpty()) {
      const route = this.routes.find((item) =>
        item.event === 'default' && item.priority === Priority.PRIMARY && !excludes.contains(item.url))
      if (route) {
        return route
      } else {
        throw new Error('No valid primary route found.')
      }
    } else {
      const event = phases.last()
      const route = this.routes.find((item) => item.event === event && item.priority === Priority.PRIMARY)
      if (route) {
        return route
      } else {
        return this.getPrimaryRoute(phases.pop(), excludes)
      }
    }
  }
  private getSecondaryRoutes(phases: List<string>, excludes: Set<string>): List<Route> {
    if (phases.isEmpty()) {
      return this.routes.filter((item) => item.event === 'default')
    } else {
      const event = phases.last()
      const routes = this.routes.filter((item) =>
        item.event === event && item.priority !== Priority.EXCLUDE && !excludes.contains(item.url))
      return routes.merge(this.getSecondaryRoutes(phases.pop(), excludes))
    }
  }
  private getExcludeRoutes(phases: List<string>): List<Route> {
    if (phases.isEmpty()) {
      return List()
    } else {
      const event = phases.last()
      const routes = this.routes.filter((item) => item.event === event && item.priority === Priority.EXCLUDE)
      return routes.merge(this.getExcludeRoutes(phases.pop()))
    }
  }
}

export default ClientRouter
