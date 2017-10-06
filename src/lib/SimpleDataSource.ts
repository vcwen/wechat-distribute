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
  public  async getRoutes() {
    return this.routes
  }
  public async getClient(name: string) {
    const url = _.get<any, string>(this.clients, name)
    if (url) {
      return new Client(name , url)
    }
  }
  public async getClients(...names: string[]) {
    const clients = _.map(names, (name) => {
      const url = _.get<any, string>(this.clients, name)
      return new Client(name, url)
    })
    return clients
  }
  public async getRootRoute() {
    return this.loadRootRoute(this.routes)
  }
}

export default SimpleDataSource
