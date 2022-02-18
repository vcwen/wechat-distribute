import { IncomingMessage, ServerResponse } from 'http'
import { Dispatcher } from './dispatcher'
import { Message } from './message'
import { MessageRouter } from './message-router'
import { WechatCrypt } from './wechat-crypt'

export class WechatAccount {
  public readonly name: string
  public readonly appId: string
  public readonly encryptionKey: string
  public readonly token: string
  public readonly crypt: WechatCrypt

  public dispatchers: Map<string, Dispatcher>
  public messageRouter: MessageRouter
  constructor(
    name: string,
    appId: string,
    encryptionKey: string,
    token: string,
    messageRouter: MessageRouter,
    dispatchers: Map<string, Dispatcher>
  ) {
    this.name = name
    this.appId = appId
    this.encryptionKey = encryptionKey
    this.token = token
    this.crypt = new WechatCrypt(appId, token, encryptionKey)
    this.messageRouter = messageRouter
    this.dispatchers = dispatchers
  }

  public distributeMessage(req: IncomingMessage, res: ServerResponse, message: Message): void {
    const [primary, secondary] = this.messageRouter.getTargetClients(message.getTopic())
    if (primary) {
      const dispatcher = this.dispatchers.get(primary)
      dispatcher.dispatchPrimary(message, req, res)
    } else {
      res.statusCode = 200
      res.end('')
    }
    if (secondary) {
      secondary.forEach((name) => {
        const dispatcher = this.dispatchers.get(name)
        dispatcher.dispatchSecondary(message, req)
      })
    }
  }
}
