class WechatAccount {
  constructor(
    readonly name: string,
    readonly appId: string,
    readonly appSecret: string,
    readonly encodingAESKey: string,
    readonly token: string) {}
}

export default WechatAccount
