import { IncomingMessage, ServerResponse } from 'http'
import { Dispatcher } from './dispatcher'
import { Message } from './message'
import { MessageRouter } from './message-router'
import { WechatCrypto } from './wechat-crypt'

export class WechatAccount {
  public readonly name: string
  public readonly appId: string
  public readonly encryptionKey: string
  public readonly token: string

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
  public getSignature(timestamp: string, nonce: string, encryptedText: string): string {
    return WechatCrypto.getSignature(this.token, timestamp, nonce, encryptedText)
  }
  public decrypt(encryptedText: string): string {
    return WechatCrypto.decrypt(encryptedText, this.appId, this.encryptionKey)
  }
}
