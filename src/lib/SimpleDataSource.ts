import { List, Map } from 'immutable'
import { WechatAccount } from '../main'
import Client from '../model/Client'
import { Interest } from '../model/Interest'
import { IDataSource } from './DataSource'

const getInterests = (data: any, parentEvent: string = '') => {
  const events = Object.getOwnPropertyNames(data)
  let interests = [] as Interest[]
  for (const event of events) {
    let fullEvent = parentEvent ? [parentEvent, event].join('.') : event
    if (event === 'default' && parentEvent) {
      fullEvent = parentEvent
    } else {
      fullEvent = event
    }
    if (typeof data[event] === 'string') {
      interests.push(new Interest(fullEvent, data[event]))
    } else {
      interests = interests.concat(getInterests(data[event], fullEvent))
    }
  }
  return interests
}
class SimpleDataSource implements IDataSource {
  private accounts: Map<string, WechatAccount>
  private clients: Map<string, List<Client>> = Map()
  constructor(accounts: any) {
    const names = Object.getOwnPropertyNames(accounts)
    this.accounts = Map<string, WechatAccount>().withMutations((mutable) => {
      for (const name of names) {
        const accountData = accounts[name]
        const accountName = accountData.name ? accountData.name : name
        const account = new WechatAccount(
          accountName,
          accountData.wechatId,
          accountData.appId,
          accountData.appSecret,
          accountData.encodingAESKey,
          accountData.token
        )
        mutable.set(account.wechatId, account)
        const clientsData = accountData.clients
        const props = Object.getOwnPropertyNames(clientsData)
        const clients = [] as Client[]
        for (const prop of props) {
          const clientName = clientsData[prop].name ? clientsData[prop].name : prop
          const interestsData = clientsData[prop].interests
          const client = new Client(clientName, clientsData[prop].url, getInterests(interestsData))
          clients.push(client)
        }
        const clientList = List.of(...clients)
        this.clients = this.clients.set(account.wechatId, clientList)
      }
    })
  }
  public getWechatAccounts() {
    return this.accounts.toList()
  }
  public getWechatAccountByWechatId(wechatId: string) {
    return this.accounts.get(wechatId)
  }
  public getClientsByWechatId(wechatId: string) {
    return this.clients.get(wechatId) || List<Client>()
  }
  public getWechatAccountByAppId(appId: string) {
    return this.accounts.find((account) => account.appId === appId)
  }
  public getClientsByAppId(appId: string) {
    const account = this.accounts.find((item) => item.appId === appId)
    if (account) {
      return this.clients.get(account.wechatId) || List<Client>()
    } else {
      return List<Client>()
    }
  }
}

export default SimpleDataSource
