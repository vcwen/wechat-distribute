import * as  wechat from 'wechat'
import WechatAccount from '../model/WechatAccount'
import ClientRouter from './ClientRouter'
import DataSource from './DataSource'
import Dispatcher from './Dispatcher'

class MessageRouter {
  private handler: any
  constructor(wechatAccount: WechatAccount, dataSource: DataSource) {
      const clientRouter = new ClientRouter(dataSource)
      const dispatcher = new Dispatcher(clientRouter)
      this.handler = wechat({
        appid: wechatAccount.appId,
        token: wechatAccount.token,
        encodingAESKey: wechatAccount.encodingAESKey,
      }, dispatcher.dispatch.bind(dispatcher))
  }
  public middlewarify() {
    return this.handler
  }
}

export default MessageRouter
