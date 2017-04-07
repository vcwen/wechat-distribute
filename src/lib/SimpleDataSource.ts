import * as Promise from 'bluebird'
import * as _ from 'lodash'
import Client from '../model/Client'
import Route from '../model/Route'
import WechatAccount from '../model/WechatAccount'
import DataSource from './DataSource'

class SimpleDataSource extends DataSource {
  private routes: any
  private clients: any
  constructor(routes: any, clients: any) {
    super()
    this.routes = Object.assign({}, routes)
    this.clients = Object.assign({}, clients)
  }
  public getClient(name: string): Promise<Client> {
    const client: any = _.get(this.clients, name)
    if (_.isEmpty(client)) {
      return Promise.resolve(null)
    } else {
      return Promise.resolve(new Client(name, client.url))
    }

  }
  public getClients(...names: string[]): Promise<Client[]> {
    const clients = _.map(names, (name) => {
      const c: any = _.get(this.clients, name)
      return new Client(name, c.url)
    })
    return Promise.resolve(clients)
  }
  public getRootRoute(): Promise<Route> {
    return Promise.resolve(this.loadRootRoute(this.routes))
  }
}

export default SimpleDataSource
