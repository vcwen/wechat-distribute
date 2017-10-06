import * as  _ from 'lodash'
import Client from '../model/Client'
import Message from '../model/Message'
import Route from '../model/Route'
import DataSource from './DataSource'

function getTargetClients(route: Route, ...phases: string[]): [string, string[]] {
  const [phase, ...left] = phases
  let primary = route.primary
  let secondary = route.secondary
  if (phase && !_.isEmpty(route.specs.get(phase))) {
    const [subPrimary, subSecondary] = getTargetClients(route.specs.get(phase), ...left)
    if (subPrimary) {
      if (primary) {
        secondary.push(primary)
      }
      primary = subPrimary
    }
    if (subSecondary) {
      secondary = secondary.concat(subSecondary)
    }
  }
  return [primary, secondary]
}

class ClientRouter {
  private dataSource: DataSource

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource
  }

  public async getClients(message: Message) {
     const phases: string[] = message.msgType === 'event' ?
       [message.msgType, message.event] : [message.msgType]
     const rootRoute: Route = await this.dataSource.getRootRoute()
     let [primary, secondary] = await getTargetClients(rootRoute, ...phases)
     secondary = _.uniq(secondary)
     secondary = _.filter(secondary, (c) => c !== primary)
     const primaryClient = await this.dataSource.getClient(primary)
     const secondaryClients = await this.dataSource.getClients(...secondary)
     return [primaryClient, secondaryClients] as [Client, Client[]]
  }
}

export default ClientRouter
