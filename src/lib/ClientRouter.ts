import * as Promise from 'bluebird'
import * as  _ from 'lodash'
import Client from '../model/Client'
import Message from '../model/Message'
import Route from '../model/Route'
import DataSource from './DataSource'

function getRouteClients(route: Route, ...phases: string[]): [string, string[]] {
  const [phase, ...left] = phases
  let primary = route.primary
  let secondary = route.secondary
  if (phase) {
    const [subPrimary, subSecondary] = getRouteClients(route.specs.get(phase), ...left)
    if (subPrimary) {
      if (primary) {
        secondary.push(primary)
      }
      primary = subPrimary
    }
    secondary = secondary.concat(subSecondary)
  }
  return [primary, secondary]
}

class ClientRouter {
  private dataSource: DataSource

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource
  }

  public getClients(message: Message): Promise<[Client, Client[]]> {
     const phases: string[] = message.msgType === 'event' ?
       [message.msgType, message.event] : [message.msgType]
     return this.dataSource.getRootRoute().then((rootRoute: Route) => {
       let [primary, secondary] = getRouteClients(rootRoute, ...phases)
       secondary = _.uniq(secondary)
       secondary = _.filter(secondary, (c) => c !== primary)
       const primaryClient = this.dataSource.getClient(primary)
       const secondaryClients = this.dataSource.getClients(...secondary)
       return Promise.all([primaryClient, secondaryClients])
     })

  }
}

export default ClientRouter
