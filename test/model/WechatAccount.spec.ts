import WechatAccount from '../../src/model/WechatAccount'

describe('WechatAccount', () => {
  describe('#constructor', () => {
    it('should  create WechatAccount', () => {

      const account = new WechatAccount('id', 'account_name', 'appId', 'appSecret',
        '4nrPbcFEKJE8AH3b2chrqbmf7txGi8S0mmBSbycnTee', 'token')
      expect(account).toBeInstanceOf(WechatAccount)
      expect(account.name).toBe('account_name')
      expect(account.id).toBe('id')
      expect(account.appId).toBe('appId')
      expect(account.appSecret).toBe('appSecret')
      expect(account.encodingAESKey).toBe('4nrPbcFEKJE8AH3b2chrqbmf7txGi8S0mmBSbycnTee')
      expect(account.token).toBe('token')
    })
  })
})
