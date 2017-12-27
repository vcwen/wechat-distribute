import ClientRouter from '../../src/lib/ClientRouter'
import SimpleDataSource from '../../src/lib/SimpleDataSource'
import Message from '../../src/model/Message'

describe('ClientRouter', () => {
  const clientsObj = {
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
        click: 'secondary'
      }
    },
    click: {
      url: 'http://main.com/click',
      interests: {
        click: 'primary'
      }
    }
  }
  describe('#constructor', () => {
    it('should  create ClientRouter', () => {
      const simpleDs = new SimpleDataSource(clientsObj)
      const clientRouter = new ClientRouter(simpleDs.getRoutes())
      expect(clientRouter).toBeInstanceOf(ClientRouter)
    })
  })

  describe('#getClients', () => {
    it('should return primary and secondary clients', async () => {
      const simpleDs = new SimpleDataSource(clientsObj)
      const clientRouter = new ClientRouter(simpleDs.getRoutes())
      const wxMsg =  {
        ToUserName: 'gh_188612cc13bf',
        FromUserName: 'ouIpDs1npAsCTtjcQ_ERI3LRpfIQ',
        CreateTime: 1487248700,
        MsgType: 'event',
        Event: 'CLICK',
        EventKey: 'article_57d114fc16a64320b2b48a0f'
      }
      const message = new Message(wxMsg, Buffer.from('rawxml', 'utf8'))
      const [primary, secondary] = await clientRouter.getClients(message)
      expect(primary).toEqual('http://main.com/click')
      expect(secondary.size).toBe(5)
      const urls = ['http://main.com/test', 'http://main.com/secondary', 'http://main.com/event_secondary1',
        'http://main.com/event_secondary2', 'http://main.com/datacube']
      urls.forEach((item) => {
        expect(secondary).toContain(item)
      })
    })
  })
})
