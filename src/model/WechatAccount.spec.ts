import * as chai from 'chai'
import WechatAccount from './WechatAccount'
const expect = chai.expect

describe('WechatAccount', () => {
  describe('#constructor', () => {
    it('should  create WechatAccount', () => {

      const account = new WechatAccount('account_name', 'appId', 'appSecret', 'encodingAESKey', 'token')
      expect(account).to.be.instanceof(WechatAccount)
      expect(account.name).to.equal('account_name')
      expect(account.appId).to.equal('appId')
      expect(account.appSecret).to.equal('appSecret')
      expect(account.encodingAESKey).to.equal('encodingAESKey')
      expect(account.token).to.equal('token')
    })
  })
})
