import { List, Map } from 'immutable'
import * as WechatCrypto from 'wechat-crypto'
import { WechatAccount } from '../main'
import Client from '../model/Client'
import Route from '../model/Route'
import { IDataSource } from './DataSource'

class SimpleDataSource implements IDataSource {
  private accounts: Map<string, WechatAccount>
  private clients: Map<string, List<Client>>
  private routes: Map<string, List<Route>>
  private crytorMap: Map<string, any>
  constructor(accounts: any) {
    this.accounts = Map<string, WechatAccount>().withMutations((mutable) => {
      for (const key in accounts) {
        if (accounts.hasOwnProperty(key)) {
          const name = accounts[key].name ? accounts[key].name : key
          const accountData = accounts[key]
          const account = new WechatAccount(
            accountData.id,
            name,
            accountData.appId,
            accountData.appId,
            accountData.appSecret,
            accountData.encodingAESKey,
            accountData.token
          )
          mutable.set(accountData.appId, account)
        }
      }
    })
    this.crytorMap = Map<string, any>().withMutations((mutable) => {
      for (const account of this.accounts.values()) {
        const cryptor = new WechatCrypto(account.token, account.encodingAESKey, account.appId)
        mutable.set(account.appId, cryptor)
      }
    })

    this.clients = Map<string, List<Client>>()
    this.routes = Map<string, List<Route>>()
    for (const key in accounts) {
      if (accounts.hasOwnProperty(key)) {
        const account = accounts[key]
        const clients = account.clients
        const clientList = List<Client>().withMutations((mutable) => {
          for (const prop in clients) {
            if (clients.hasOwnProperty(prop)) {
              const name = clients[prop].name ? clients[prop].name : prop
              const client = new Client(name, clients[prop].url, clients[prop].interests)
              mutable.push(client)
            }
          }
        })
        this.clients = this.clients.set(account.appId, clientList)
        const routeList = List<Route>().withMutations((mutable) => {
          clientList.forEach((client) => {
            mutable.merge(client.getRoutes())
          })
        })
        this.routes = this.routes.set(accounts[key].appId, routeList)
      }
    }
  }
  public getWechatAccounts() {
    return this.accounts.toList()
  }
  public getWechatAccount(appId: string) {
    return this.accounts.get(appId)
  }
  public getWechatAccountById(id: string) {
    return this.accounts.find((account) => account.id === id)
  }
  public getClients(appId: string) {
    return this.clients.get(appId) || List<Client>()
  }
  public getRoutes(appId: string) {
    return this.routes.get(appId) || List<Route>()
  }
  public getRoutesById(id: string): List<Route> {
    const account = this.getWechatAccountById(id)
    if (account) {
      return this.getRoutes(account.appId)
    } else {
      return List()
    }
  }
  public getCryptor(appId: string) {
    return this.crytorMap.get(appId)
  }
}

export default SimpleDataSource
