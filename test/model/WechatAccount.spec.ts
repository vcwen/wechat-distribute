import WechatAccount from '../../src/model/WechatAccount'

describe('WechatAccount', () => {
  describe('#constructor', () => {
    it('should  create WechatAccount', () => {

      const account = new WechatAccount('account_name', 'appId', 'appSecret', 'encodingAESKey', 'token')
      expect(account).toBeInstanceOf(WechatAccount)
      expect(account.name).toBe('account_name')
      expect(account.appId).toBe('appId')
      expect(account.appSecret).toBe('appSecret')
      expect(account.encodingAESKey).toBe('encodingAESKey')
      expect(account.token).toBe('token')
    })
  })
})
