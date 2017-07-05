import * as Koa from 'koa'
import * as WechatCrypto from 'wechat-crypto'
import WechatAccount from '../model/WechatAccount'
import ClientRouter from './ClientRouter'
import DataSource from './DataSource'
import Dispatcher from './Dispatcher'
import Helper from './Helper'

class MessageRouter {
  private cryptor: WechatCrypto
  private account: WechatAccount
  private dispatcher: Dispatcher
  constructor(wechatAccount: WechatAccount, dataSource: DataSource) {
    this.account = wechatAccount
    const clientRouter = new ClientRouter(dataSource)
    const dispatcher = new Dispatcher(clientRouter)
    this.cryptor = new WechatCrypto(wechatAccount.token, wechatAccount.encodingAESKey, wechatAccount.appId)
  }
  public middlewarify() {
    return async (ctx: Koa.Context) => {
      const query = ctx.query
      const encrypted = !!(query.encrypt_type && query.encrypt_type === 'aes' && query.msg_signature)
      const timestamp = query.timestamp
      const nonce = query.nonce
      const echostr = query.echostr

      if (ctx.method === 'GET') {
        let valid = false
        if (encrypted) {
          const signature = query.msg_signature
          valid = signature === this.cryptor.getSignature(timestamp, nonce, echostr)
        } else {
          valid = query.signature === Helper.getSignature(timestamp, nonce, this.account.token)
        }
        if (!valid) {
          ctx.throw(401, 'Invalid signature')
        } else {
          if (encrypted) {
            const decrypted = this.cryptor.decrypt(echostr)
            ctx.body = decrypted.message
          } else {
            ctx.body = echostr
          }
        }
      } else if (ctx.method === 'POST') {
        if (!encrypted) {
          if (query.signature !== Helper.getSignature(timestamp, nonce, this.account.token)) {
            return ctx.throw(401, 'Invalid signature')
          }
        }
        const message = await Helper.extractWechatMessage(ctx, encrypted)
        this.dispatcher.dispatch(ctx, message)
      } else {
        ctx.throw(501, 'Not Implemented')
      }
    }
  }
}

export default MessageRouter
