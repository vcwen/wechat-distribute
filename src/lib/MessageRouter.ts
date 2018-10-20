import * as Koa from 'koa'
import { IRouterContext } from 'koa-router'
import ClientRouter from './ClientRouter'
import { IDataSource } from './DataSource'
import Dispatcher from './Dispatcher'
import Helper from './Helper'
import { extractAppId } from './Helper'

class MessageRouter {
  private dataSource: IDataSource
  private dispatcher: Dispatcher
  constructor(dataSource: IDataSource) {
    const clientRouter = new ClientRouter(dataSource)
    this.dispatcher = new Dispatcher(clientRouter)
    this.dataSource = dataSource
  }
  public middlewarify() {
    return async (ctx: IRouterContext) => {
      const query = ctx.query
      const encrypted = !!(query.encrypt_type && query.encrypt_type === 'aes' && query.msg_signature)
      const timestamp = query.timestamp
      const nonce = query.nonce
      const echostr = query.echostr
      const appId = extractAppId(ctx.originalUrl)
      if (!appId) {
        return ctx.throw(404)
      }
      const account = this.dataSource.getWechatAccount(appId)
      if (!account) {
        return ctx.throw(404)
      }
      const cryptor = this.dataSource.getCryptor(appId)
      if (ctx.method === 'GET') {
        let valid = false
        if (encrypted) {
          const signature = query.msg_signature
          valid = signature === cryptor.getSignature(timestamp, nonce, echostr)
        } else {
          valid = query.signature === Helper.getSignature(timestamp, nonce, account.token)
        }
        if (!valid) {
          return ctx.throw(401, 'Invalid signature')
        } else {
          if (encrypted) {
            const decrypted = cryptor.decrypt(echostr)
            ctx.body = decrypted.message
          } else {
            ctx.body = echostr
          }
        }
      } else if (ctx.method === 'POST') {
        if (!encrypted) {
          if (query.signature !== Helper.getSignature(timestamp, nonce, account.token)) {
            return ctx.throw(401, 'Invalid signature')
          }
        }
        const message = await Helper.extractWechatMessage(ctx, cryptor)
        await this.dispatcher.dispatch(ctx, message)
      } else {
        ctx.throw(501, 'Not Implemented')
      }
    }
  }
}

export default MessageRouter
