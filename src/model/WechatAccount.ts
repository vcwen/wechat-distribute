class WechatAccount {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly appId: string,
    readonly wechatId: string,
    readonly appSecret: string,
    readonly encodingAESKey: string,
    readonly token: string
  ) {}
}

export default WechatAccount
