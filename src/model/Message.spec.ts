import * as chai from 'chai'
import Message from './Message'
const expect = chai.expect

describe('Message', () => {
  describe('#constructor', () => {
    it('should  create Message', () => {
      const wxMsg =  {
        ToUserName: 'gh_188612cc13bf',
        FromUserName: 'ouIpDs1npAsCTtjcQ_ERI3LRpfIQ',
        CreateTime: 1487248700,
        MsgType: 'event',
        Event: 'CLICK',
        EventKey: 'article_57d114fc16a64320b2b48a0f',
      }
      const message = new Message(wxMsg, Buffer.from('xml', 'utf8'))
      expect(message).to.be.instanceof(Message)
      expect(message.toUserName).to.equal('gh_188612cc13bf')
      expect(message.fromUserName).to.equal('ouIpDs1npAsCTtjcQ_ERI3LRpfIQ')
      expect(message.createTime).to.equal(1487248700)
      expect(message.msgType).to.equal('event')
      expect(message.event).to.equal('click')
      expect(message.eventKey).to.equal('article_57d114fc16a64320b2b48a0f')
    })
  })
})
