import * as chai from 'chai'
import SimpleDataSource from './SimpleDataSource'
const expect = chai.expect

describe('SimpleDataSource', () => {
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
      }
  describe('#constructor', () => {
    it('should  create SimpleDataSource', () => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      expect(simpleDs).to.be.instanceof(SimpleDataSource)
    })
  })

  describe('#getClient', () => {
    it('should return client promise', (done) => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      simpleDs.getClient('main').then((client) => {
        expect(client.name).to.equal('main')
        expect(client.url).to.equal(clientsObj.main.url)
        done()
      })
    })

    it('should return empty promise if name is empty string or null', (done) => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      simpleDs.getClient(null).then((client) => {
        expect(client).to.be.null
        done()
      })
    })
    it('should return empty promise if client not exists', (done) => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      simpleDs.getClient('main1').then((client) => {
        expect(client).to.be.null
        done()
      })
    })
  })

  describe('#getClients', () => {
    it('should return clients promise', (done) => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      simpleDs.getClients('main', 'datacube').then((clients) => {
        expect(clients).to.have.lengthOf(2)
        expect(clients[0].name).to.equal('main')
        expect(clients[0].url).to.equal(clientsObj.main.url)
        expect(clients[1].name).to.equal('datacube')
        expect(clients[1].url).to.equal(clientsObj.datacube.url)
        done()
      })
    })
  })

  describe('#getRootRoute', () => {
    it('should return root route promise', (done) => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      simpleDs.getRootRoute().then((rootRoute) => {
        expect(rootRoute.primary).to.equal('main')
        expect(rootRoute.secondary).to.have.lengthOf(1)
        expect(rootRoute.secondary[0]).to.equal('secondary')
        const textRoute = rootRoute.specs.get('text')
        expect(textRoute.primary).to.equal('textPrimary')
        expect(textRoute.secondary).to.be.empty
        const eventRoute = rootRoute.specs.get('event')
        expect(eventRoute.primary).to.be.null
        expect(eventRoute.secondary).to.be.deep.equal(['event_secondary1', 'event_secondary2'])
        const clickRoute = eventRoute.specs.get('click')
        expect(clickRoute.secondary).to.deep.equal(['datacube'])
        done()
      })
    })
  })
})
