import {List, Map} from 'immutable'
import * as WechatCrypto from 'wechat-crypto'
import { WechatAccount } from '../main'
import Client from '../model/Client'
import Route from '../model/Route'
import {IDataSource} from './DataSource'

class SimpleDataSource implements IDataSource {
  private accountMap: Map<string, WechatAccount>
  private clientMap: Map<string, List<Client>>
  private routeMap: Map<string, List<Route>>
  private crytorMap: Map<string, any>
  constructor(accounts: any) {
    this.accountMap = Map<string, WechatAccount>().withMutations((mutable) => {
      for (const key in accounts) {
        if (accounts.hasOwnProperty(key)) {
          const name = accounts[key].name ? accounts[key].name : key
          const accountData = accounts[key]
          const account = new WechatAccount(accountData.id, name, accountData.appId,
            accountData.appSecret, accountData.encodingAESKey, accountData.token)
          mutable.set(accountData.appId, account)
        }
      }
    })
    this.crytorMap = Map<string, any>().withMutations((mutable) => {
      for (const account of this.accountMap.values()) {
        const cryptor = new WechatCrypto(account.token, account.encodingAESKey, account.appId)
        mutable.set(account.appId, cryptor)
      }
    })

    this.clientMap = Map<string, List<Client>>()
    this.routeMap = Map<string, List<Route>>()
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
        this.clientMap = this.clientMap.set(account.appId, clientList)
        const routeList = List<Route>().withMutations((mutable) => {
          clientList.forEach((client) => {
            mutable.merge(client.getRoutes())
          })
        })
        this.routeMap = this.routeMap.set(accounts[key].appId, routeList)
      }
    }

  }
  public getWechatAccounts() {
    return this.accountMap.toList()
  }
  public getWechatAccount(appId: string) {
    return this.accountMap.get(appId)
  }
  public getWechatAccountById(id: string) {
    return this.accountMap.find((account) => account.id === id)
  }
  public getClients(appId: string) {
    return this.clientMap.get(appId) || List<Client>()
  }
  public getRoutes(appId: string) {
    return this.routeMap.get(appId) || List<Route>()
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

export  default SimpleDataSource
