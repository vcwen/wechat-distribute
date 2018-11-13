class WechatAccount {
  public readonly name: string
  public readonly wechatId: string
  public readonly appId: string
  public readonly appSecret: string
  public readonly encodingAESKey: string
  public readonly token: string
  constructor(name: string, wechatId: string, appId: string, appSecret: string, encodingAESKey: string, token: string) {
    this.name = name
    this.wechatId = wechatId
    this.appId = appId
    this.appSecret = appSecret
    this.encodingAESKey = encodingAESKey
    this.token = token
  }
}

export default WechatAccount
