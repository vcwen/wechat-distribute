import ClientRouter from '../../src/lib/ClientRouter'
import SimpleDataSource from '../../src/lib/SimpleDataSource'
import Message from '../../src/model/Message'

describe('ClientRouter', () => {
  const routesObj: any = {
        primary: 'main',
        secondary: ['secondary'],
        specs: {
          text: {
            primary: 'textPrimary'
          },
          event: {
            secondary: ['event_secondary1', 'event_secondary2'],
            specs: {
              click: {
                primary: 'click',
                secondary: 'datacube'
              }
            }
          }
        }
      }
  const clientsObj = {
        main: 'http://main.com/test',
        secondary: 'http://main.com/secondary',
        textPrimary: 'http://main.com/textPrimary',
        event_secondary1: 'http://main.com/event_secondary1',
        event_secondary2: 'http://main.com/event_secondary2',
        datacube: 'http://main.com/datacube',
        click: 'http://main.com/click'
      }
  describe('#constructor', () => {
    it('should  create ClientRouter', () => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      const clientRouter = new ClientRouter(simpleDs)
      expect(clientRouter).toBeInstanceOf(ClientRouter)
    })
  })

  describe('#getClients', () => {
    it('should return primary and secondary clients promise', async () => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      const clientRouter = new ClientRouter(simpleDs)
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
      expect(primary.name).toEqual('click')
      expect(secondary).toHaveLength(5)
      expect(secondary.map((item) => item.name))
      .toEqual([ 'secondary', 'main', 'event_secondary1', 'event_secondary2', 'datacube' ])

    })
  })
})
