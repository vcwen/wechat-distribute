import {List} from 'immutable'
import Client from '../model/Client'
import Route from '../model/Route'
import {IDataSource} from './DataSource'

class SimpleDataSource implements IDataSource {
  private clients: List<Client>
  private routes: List<Route>
  constructor(clients: any) {
    const clientList = List()
    this.clients = clientList.withMutations((mutable) => {
      for (const key in clients) {
        if (clients.hasOwnProperty(key)) {
          const name = clients[key].name ? clients[key].name : key
          const client = new Client(name, clients[key].url, clients[key].interests)
          mutable.push(client)
        }
      }
    })
    const routeList = List()
    this.routes = routeList.withMutations((mutable) => {
      this.clients.forEach((client) => {
        mutable.merge(client.getRoutes())
      })
    })
  }
  public getClients() {
    return this.clients
  }
  public getRoutes() {
    return this.routes
  }
}

export  default SimpleDataSource
