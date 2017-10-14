import Message from '../../src/model/Message'

describe('Message', () => {
  describe('#constructor', () => {
    it('should  create Message', () => {
      const wxMsg =  {
        ToUserName: 'gh_188612cc13bf',
        FromUserName: 'ouIpDs1npAsCTtjcQ_ERI3LRpfIQ',
        CreateTime: 1487248700,
        MsgType: 'event',
        Event: 'CLICK',
        EventKey: 'article_57d114fc16a64320b2b48a0f'
      }
      const message = new Message(wxMsg, Buffer.from('xml', 'utf8'))
      expect(message).toBeInstanceOf(Message)
      expect(message.toUserName).toEqual('gh_188612cc13bf')
      expect(message.fromUserName).toEqual('ouIpDs1npAsCTtjcQ_ERI3LRpfIQ')
      expect(message.createTime).toEqual(1487248700)
      expect(message.msgType).toEqual('event')
      expect(message.event).toEqual('click')
      expect(message.eventKey).toEqual('article_57d114fc16a64320b2b48a0f')
    })
  })
})
