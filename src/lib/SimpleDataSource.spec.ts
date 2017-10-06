import * as chai from 'chai'
import SimpleDataSource from './SimpleDataSource'
const expect = chai.expect

describe('SimpleDataSource', () => {
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
                secondary: 'datacube'
              }
            }
          }
        }
      }
  const clientsObj = {
        main: 'http://main.com/test',
        textPrimary: 'http://main.com/textPrimary',
        event_secondary1: 'http://main.com/event_secondary1',
        event_secondary2: 'http://main.com/event_secondary2',
        datacube: 'http://main.com/datacube'
      }
  describe('#constructor', () => {
    it('should  create SimpleDataSource', () => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      expect(simpleDs).to.be.instanceof(SimpleDataSource)
    })
  })

  describe('#getClient', () => {
    it('should return client promise', async () => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      const client = await simpleDs.getClient('main')
      expect(client.name).to.equal('main')
      expect(client.url).to.equal(clientsObj.main)
    })

    it('should return empty promise if name is empty string or null', async () => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      const client = await simpleDs.getClient(null)
      expect(client).to.be.undefined
    })
    it('should return empty promise if client not exists', async () => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      const client = await simpleDs.getClient('main1')
      expect(client).to.be.undefined
    })
  })

  describe('#getClients', () => {
    it('should return clients', async () => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      const clients = await simpleDs.getClients('main', 'datacube')
      expect(clients).to.have.lengthOf(2)
      expect(clients[0].name).to.equal('main')
      expect(clients[0].url).to.equal(clientsObj.main)
      expect(clients[1].name).to.equal('datacube')
      expect(clients[1].url).to.equal(clientsObj.datacube)
    })
  })

  describe('#getRootRoute', () => {
    it('should return root route ', async () => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      const rootRoute = await simpleDs.getRootRoute()
      expect(rootRoute.primary).to.equal('main')
      expect(rootRoute.secondary).to.have.lengthOf(1)
      expect(rootRoute.secondary[0]).to.equal('secondary')
      const textRoute = rootRoute.specs.get('text')
      expect(textRoute.primary).to.equal('textPrimary')
      expect(textRoute.secondary).to.be.empty
      const eventRoute = rootRoute.specs.get('event')
      expect(eventRoute.primary).to.be.undefined
      expect(eventRoute.secondary).to.be.deep.equal(['event_secondary1', 'event_secondary2'])
      const clickRoute = eventRoute.specs.get('click')
      expect(clickRoute.secondary).to.deep.equal(['datacube'])
    })
  })
})
