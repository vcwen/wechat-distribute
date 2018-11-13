import { Map } from 'immutable'
import { Context } from 'koa'
import getRawBody from 'raw-body'
import Message from '../model/Message'
import WechatAccount from '../model/WechatAccount'
import { IDataSource } from './DataSource'
import Dispatcher from './Dispatcher'
import { getSignature, parseXML } from './utils'
import { WXBizMsgCrypt } from './WXBizMsgCrypt'

class MessageRouter {
  private _dataSource: IDataSource
  private dispatcher: Dispatcher
  private _crypts: Map<string, WXBizMsgCrypt>
  constructor(dataSource: IDataSource) {
    this.dispatcher = new Dispatcher(dataSource)
    this._dataSource = dataSource
    this._crypts = Map()
  }
  public middlewarify() {
    return async (ctx: Context) => {
      if (!['GET', 'POST'].includes(ctx.method)) {
        return ctx.throw(501, 'Not Implemented')
      }
      const appId: string = ((ctx as any).params && (ctx as any).params.appId) || ctx.query.appId
      if (!appId) {
        return ctx.throw(400, 'AppId is required.')
      }
      const wechatAccount = this._dataSource.getWechatAccountByAppId(appId)
      if (!wechatAccount) {
        return ctx.throw(400, 'Invalid appId')
      }
      const encrypted = ctx.query.encrypt_type === 'aes'
      if (!encrypted) {
        if (!this._checkSignature(ctx, wechatAccount)) {
          return ctx.throw(401, 'Invalid signature')
        }
      }

      if (ctx.method === 'GET') {
        const echostr = ctx.query.echostr
        ctx.body = echostr
      } else if (ctx.method === 'POST') {
        const rawBody: Buffer = await getRawBody(ctx.req, {
          length: ctx.length,
          limit: '1mb'
        })
        const xml = rawBody.toString()
        const { xml: data } = await parseXML(xml)
        let messageXml = xml
        if (encrypted) {
          const cryptor = await this._getWechatCrypt(wechatAccount)
          if (!this._checkEncryptedSignature(ctx, cryptor, data.encrypt)) {
            return ctx.throw(401, 'Invalid signature')
          }
          messageXml = cryptor.decrypt(data.encrypt)
        }
        const { xml: originalMsg } = await parseXML(messageXml)
        const { fromUserName, toUserName, createTime, msgType } = originalMsg

        const msg = new Message(fromUserName, toUserName, Number.parseInt(createTime, 10), msgType, rawBody)
        if (msgType === 'event') {
          const { event, eventKey } = originalMsg
          msg.event = event
          msg.eventKey = eventKey
        }
        await this.dispatcher.dispatch(ctx, msg)
      }
    }
  }
  private async _getWechatCrypt(wechatAccount: WechatAccount) {
    let crypt = this._crypts.get(wechatAccount.wechatId)
    if (!crypt) {
      const { token, encodingAESKey, appId, wechatId } = wechatAccount
      crypt = new WXBizMsgCrypt(token, encodingAESKey, appId)
      this._crypts = this._crypts.set(wechatId, crypt)
    }
    return crypt
  }
  private _checkSignature(ctx: Context, wechatAccount: WechatAccount) {
    const { signature, timestamp, nonce } = ctx.query
    return signature === getSignature(timestamp, nonce, wechatAccount.token)
  }
  private _checkEncryptedSignature(ctx: Context, cryptor: WXBizMsgCrypt, ciphertext: string) {
    const { msg_signature, timestamp, nonce } = ctx.query
    return msg_signature === cryptor.getSignature(timestamp, nonce, ciphertext)
  }
}

export default MessageRouter
