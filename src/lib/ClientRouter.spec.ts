import * as chai from 'chai'
import Message from '../model/Message'
import ClientRouter from './ClientRouter'
import SimpleDataSource from './SimpleDataSource'
const expect = chai.expect

describe('ClientRouter', () => {
  const routesObj: any = {
        primary: 'main',
        secondary: ['secondary'],
        specs: {
          text: {
            primary: 'textPrimary',
          },
          event: {
            secondary: ['event_secondary1', 'event_secondary2'],
            specs: {
              click: {
                primary: 'click',
                secondary: 'datacube',
              },
            },
          },
        },
      }
  const clientsObj = {
        main: {
          url: 'http://main.com/test',
        },
        secondary: {
          url: 'http://main.com/secondary',
        },
        textPrimary: {
          url: 'http://main.com/textPrimary',
        },
        event_secondary1: {
          url: 'http://main.com/event_secondary1',
        },
        event_secondary2: {
          url: 'http://main.com/event_secondary2',
        },
        datacube: {
          url: 'http://main.com/datacube',
        },
        click: {
          url: 'http://main.com/click',
        },
      }
  describe('#constructor', () => {
    it('should  create ClientRouter', () => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      const clientRouter = new ClientRouter(simpleDs)
      expect(clientRouter).to.be.instanceof(ClientRouter)
    })
  })

  describe('#getClients', () => {
    it('should return primary and secondary clients promise', (done) => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      const clientRouter = new ClientRouter(simpleDs)
      const wxMsg =  {
        ToUserName: 'gh_188612cc13bf',
        FromUserName: 'ouIpDs1npAsCTtjcQ_ERI3LRpfIQ',
        CreateTime: 1487248700,
        MsgType: 'event',
        Event: 'CLICK',
        EventKey: 'article_57d114fc16a64320b2b48a0f',
      }
      const message = new Message(wxMsg)
      clientRouter.getClients(message).then(([primary, secondary]) => {
        expect(primary.name).to.equal('click')
        expect(secondary).to.have.lengthOf(5)
        expect(secondary.map((item) => item.name)).to.deep
          .equal([ 'secondary', 'main', 'event_secondary1', 'event_secondary2', 'datacube' ])
        done()
      })
    })
  })
})
