import { List } from 'immutable'
import { WechatAccount } from '../main'
import { Client } from '../model/Client'
export interface IDataSource {
  getWechatAccounts(): List<WechatAccount>
  getWechatAccountByWechatId(wechatId: string): WechatAccount | undefined
  getClientsByWechatId(wechatId: string): List<Client>
  getWechatAccountByAppId(appId: string): WechatAccount | undefined
  getClientsByAppId(appId: string): List<Client>
}
