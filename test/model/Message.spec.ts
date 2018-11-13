import Message from '../../src/model/Message'

describe('Message', () => {
  describe('#constructor', () => {
    it('should  create Message', () => {
      const wxMsg = {
        toUserName: 'gh_188612cc13bf',
        fromUserName: 'ouIpDs1npAsCTtjcQ_ERI3LRpfIQ',
        createTime: 1487248700,
        msgType: 'event',
        event: 'CLICK',
        eventKey: 'article_57d114fc16a64320b2b48a0f'
      }
      const message = new Message(
        wxMsg.fromUserName,
        wxMsg.toUserName,
        wxMsg.createTime,
        wxMsg.msgType,
        Buffer.from('xml', 'utf8')
      )
      message.event = wxMsg.event.toLowerCase()
      message.eventKey = wxMsg.eventKey.toLowerCase()
      expect(message).toBeInstanceOf(Message)
      expect(message.toUserName).toEqual('gh_188612cc13bf')
      expect(message.fromUserName).toEqual('ouIpDs1npAsCTtjcQ_ERI3LRpfIQ')
      expect(message.createTime.getTime()).toEqual(1487248700000)
      expect(message.msgType).toEqual('event')
      expect(message.event).toEqual('click')
      expect(message.eventKey).toEqual('article_57d114fc16a64320b2b48a0f')
    })
  })
})
