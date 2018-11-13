import ClientRouter from '../../src/lib/ClientRouter'
import SimpleDataSource from '../../src/lib/SimpleDataSource'
import Message from '../../src/model/Message'

describe('ClientRouter', () => {
  const accounts = {
    test: {
      appId: 'appId',
      name: 'account_name',
      wechatId: 'wechat_id',
      appSecret: 'appSecret',
      encodingAESKey: '4nrPbcFEKJE8AH3b2chrqbmf7txGi8S0mmBSbycnTee',
      token: 'token',
      clients: {
        main: {
          name: 'Main',
          url: 'http://main.com/test',
          interests: {
            default: 'primary'
          }
        },
        secondary: {
          url: 'http://main.com/secondary',
          interests: {
            default: 'secondary'
          }
        },
        textPrimary: {
          url: 'http://main.com/textPrimary',
          interests: {
            text: 'primary'
          }
        },
        event_secondary1: {
          url: 'http://main.com/event_secondary1',
          interests: {
            event: 'secondary'
          }
        },
        event_secondary2: {
          url: 'http://main.com/event_secondary2',
          interests: {
            event: 'secondary'
          }
        },
        datacube: {
          url: 'http://main.com/datacube',
          interests: {
            'event.click': 'secondary'
          }
        },
        click: {
          url: 'http://main.com/click',
          interests: {
            'event.click': 'primary'
          }
        }
      }
    }
  }
  describe('#constructor', () => {
    it('should  create ClientRouter', () => {
      const simpleDs = new SimpleDataSource(accounts)
      const clientRouter = new ClientRouter(simpleDs.getClientsByWechatId('wechat_id'))
      expect(clientRouter).toBeInstanceOf(ClientRouter)
    })
  })

  describe('#getClients', () => {
    it('should return primary and secondary clients', async () => {
      const simpleDs = new SimpleDataSource(accounts)
      const clientRouter = new ClientRouter(simpleDs.getClientsByWechatId('wechat_id'))
      const wxMsg = {
        toUserName: 'id',
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
        Buffer.from('rawxml', 'utf8')
      )
      message.event = wxMsg.event.toLowerCase()
      const [primary, secondary] = await clientRouter.getTargetClients(message)
      expect(primary).toEqual('http://main.com/click')
      expect(secondary.size).toBe(5)
      const urls = [
        'http://main.com/test',
        'http://main.com/secondary',
        'http://main.com/event_secondary1',
        'http://main.com/event_secondary2',
        'http://main.com/datacube'
      ]
      urls.forEach((item) => {
        expect(secondary).toContain(item)
      })
    })
  })
})
