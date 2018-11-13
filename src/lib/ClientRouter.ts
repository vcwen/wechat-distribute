import { List, Set } from 'immutable'
import Client from '../model/Client'
import { Message } from '../model/Message'
import Route from '../model/Route'
import { Priority } from './Constants'

class ClientRouter {
  private _routes: List<Route>
  constructor(clients: List<Client>) {
    const routes = clients.reduce(
      (acc, client) => {
        const rs = client.interests.map((interest) => {
          return new Route(client.name, interest.event, client.url, interest.priority)
        })
        return acc.concat(rs)
      },
      [] as Route[]
    )
    this._routes = List.of(...routes)
  }
  public getTargetClients(message: Message): [string | undefined, Set<string>] {
    const phaseList = message.getPhases()
    const primaryRoute = this._getPrimaryRoute(phaseList)
    const primary = primaryRoute ? primaryRoute.url : undefined
    const secondaries = Set.of(...this._getSecondaryRoutes(phaseList).map((item) => item.url)).filterNot(
      (url) => url === primary
    )
    return [primary, secondaries]
  }
  private _getPrimaryRoute(phases: List<string>, excludes: Set<string> = Set()): Route | undefined {
    if (phases.isEmpty()) {
      const route = this._routes.find(
        (item) => item.event === 'default' && item.priority === Priority.PRIMARY && !excludes.contains(item.url)
      )
      if (route) {
        return route
      }
    } else {
      const event = phases.join('.')
      const route = this._routes.find(
        (item) => item.event === event && item.priority === Priority.PRIMARY && !excludes.contains(item.url)
      )
      if (route) {
        return route
      } else {
        const ex = this.getExcludeClients(phases)
        return this._getPrimaryRoute(phases.pop(), excludes.merge(ex))
      }
    }
  }
  private _getSecondaryRoutes(phases: List<string>, excludes: Set<string> = Set()): List<Route> {
    if (phases.isEmpty()) {
      return this._routes.filter((item) => item.event === 'default' && !excludes.contains(item.url))
    } else {
      const event = phases.join('.')
      const rs = this._routes.filter(
        (item) => item.event === event && item.priority !== Priority.EXCLUDE && !excludes.contains(item.url)
      )
      const ex = this.getExcludeClients(phases)
      return rs.merge(this._getSecondaryRoutes(phases.pop(), excludes.merge(ex)))
    }
  }
  private getExcludeClients(phases: List<string>): Set<string> {
    const event = phases.join('.')
    const excludes = this._routes.filter((item) => item.event === event && item.priority === Priority.EXCLUDE)
    return excludes.map((item) => item.url).toSet()
  }
}

export default ClientRouter
