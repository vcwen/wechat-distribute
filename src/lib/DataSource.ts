import * as _ from 'lodash'
import Client from '../model/Client'
import Route from '../model/Route'
import WechatAccount from '../model/WechatAccount'
abstract class DataSource {
  public abstract async getClient(name: string): Promise<Client>
  public abstract async getClients(...names: string[]): Promise<Client[]>
  public abstract async getRoutes()
  public abstract async getRootRoute()
  protected  loadRootRoute(route: any): Route {
    function loadRoute(routeObj: any, isRoot: boolean = false) {
      const primary = _.get<object, string>(routeObj, 'primary')
      const secondary = _.get<object, string[]>(routeObj, 'secondary', [])
      if (isRoot && _.isEmpty(primary)) {
        throw new TypeError('Primary client is required for root route.')
      }
      const specs = new Map<string, Route> ()
      if (!_.isEmpty(routeObj.specs)) {
        for (const key in routeObj.specs) {
          if (routeObj.specs.hasOwnProperty(key)) {
            specs.set(key, loadRoute(routeObj.specs[key]))
          }
        }
      }
      return new Route(primary, secondary, specs)
    }
    return loadRoute(route, true)
  }
}
export default DataSource
