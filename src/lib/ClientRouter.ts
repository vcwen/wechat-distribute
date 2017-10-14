import * as  _ from 'lodash'
import Client from '../model/Client'
import Message from '../model/Message'
import Route from '../model/Route'
import DataSource from './DataSource'

function getTargetClients(route: Route, ...phases: string[]): [string | undefined, string[]] {
  const [phase, ...left] = phases
  let primary = route.primary
  let secondary = route.secondary
  const subRoute = route.specs.get(phase)
  if (phase && subRoute) {
    const [subPrimary, subSecondary] = getTargetClients(subRoute, ...left)
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
     const phases = message.getPhases()
     const rootRoute: Route = await this.dataSource.getRootRoute()
     let [primary, secondary] = await getTargetClients(rootRoute, ...phases)
     secondary = _.uniq(secondary)
     secondary = _.filter(secondary, (c) => c !== primary)
     let primaryClient: Client | undefined
     if (primary) {
      primaryClient = await this.dataSource.getClient(primary)
     }
     const secondaryClients = await this.dataSource.getClients(...secondary)
     return [primaryClient, secondaryClients] as [Client | undefined, Client[]]
  }
}

export default ClientRouter
