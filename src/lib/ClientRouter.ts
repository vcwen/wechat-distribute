import {List, Set} from 'immutable'
import { IDataSource } from '../main'
import {Message} from '../model/Message'
import Route from '../model/Route'
import { Priority } from './Constants'

class ClientRouter {
  private dataSource: IDataSource

  constructor(dataSource: IDataSource) {
    this.dataSource = dataSource
  }
  public getClients(message: Message): [string, Set<string>] {
    const routes = this.dataSource.getRoutesById(message.toUserName)
    if (routes.isEmpty()) {
      throw new Error(`Not clients found for this message.[${message.msgId}]`)
    }
    const phaseList = message.getPhases()
    const primary = this.getPrimaryRoute(routes, phaseList).url
    const secondaries = Set.of(...this.getSecondaryRoutes(routes, phaseList).map((item) => item.url))
      .filterNot((url) => url === primary)
    return [primary, secondaries]
  }
  private getPrimaryRoute(routes: List<Route>, phases: List<string>, excludes: Set<string> = Set()): Route {
    if (phases.isEmpty()) {
      const route = routes.find((item) =>
        item.event === 'default' && item.priority === Priority.PRIMARY && !excludes.contains(item.url))
      if (route) {
        return route
      } else {
        throw new Error('No valid primary route found.')
      }
    } else {
      const event = phases.last()
      const route = routes.find((item) => item.event === event
        && item.priority === Priority.PRIMARY && !excludes.contains(item.url))
      if (route) {
        return route
      } else {
        const ex = this.getExcludeClients(routes, phases)
        return this.getPrimaryRoute(routes, phases.pop(), excludes.merge(ex))
      }
    }
  }
  private getSecondaryRoutes(routes: List<Route>, phases: List<string>, excludes: Set<string> = Set()): List<Route> {
    if (phases.isEmpty()) {
      return routes.filter((item) => item.event === 'default' && !excludes.contains(item.url))
    } else {
      const event = phases.last()
      const rs = routes.filter((item) =>
        item.event === event && item.priority !== Priority.EXCLUDE && !excludes.contains(item.url))
      const ex = this.getExcludeClients(routes, phases)
      return rs.merge(this.getSecondaryRoutes(routes, phases.pop(), excludes.merge(ex)))
    }
  }
  private getExcludeClients(routes: List<Route>, phases: List<string>): Set<string> {
    const event = phases.last()
    const excludes = routes.filter((item) => item.event === event && item.priority === Priority.EXCLUDE)
    return excludes.map((item) => item.url).toSet()
  }
}

export default ClientRouter
