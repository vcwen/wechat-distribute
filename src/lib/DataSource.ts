import * as Promise from 'bluebird'
import * as _ from 'lodash'
import Client from '../model/Client'
import Route from '../model/Route'
import WechatAccount from '../model/WechatAccount'
abstract class DataSource {
  public abstract getClient(name: string): Promise<Client>
  public abstract getClients(...names: string[]): Promise<Client[]>
  public abstract getRootRoute(): Promise<Route>
  protected  loadRootRoute(route: any): Route {
    function loadRoute(routeObj: any) {
      const primary = _.get<object, string>(routeObj, 'primary', null)
      const secondary = _.get<object, string[]>(routeObj, 'secondary', [])
      if (route.root && _.isEmpty(primary)) {
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
    return loadRoute(route)
  }
}
export default DataSource
