import SimpleDataSource from '../../src/lib/SimpleDataSource'

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
      expect(simpleDs).toBeInstanceOf(SimpleDataSource)
    })
  })

  describe('#getClient', () => {
    it('should return client promise', async () => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      const client = await simpleDs.getClient('main')
      expect(client.name).toBe('main')
      expect(client.url).toBe(clientsObj.main)
    })

    it('should return empty promise if name is empty string or null', async () => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      const client = await simpleDs.getClient(null)
      expect(client).toBeUndefined()
    })
    it('should return empty promise if client not exists', async () => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      const client = await simpleDs.getClient('main1')
      expect(client).toBeUndefined()
    })
  })

  describe('#getClients', () => {
    it('should return clients', async () => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      const clients = await simpleDs.getClients('main', 'datacube')
      expect(clients).toHaveLength(2)
      expect(clients[0].name).toBe('main')
      expect(clients[0].url).toBe(clientsObj.main)
      expect(clients[1].name).toBe('datacube')
      expect(clients[1].url).toBe(clientsObj.datacube)
    })
  })

  describe('#getRootRoute', () => {
    it('should return root route ', async () => {
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      const rootRoute = await simpleDs.getRootRoute()
      expect(rootRoute.primary).toBe('main')
      expect(rootRoute.secondary).toHaveLength(1)
      expect(rootRoute.secondary[0]).toEqual('secondary')
      const textRoute = rootRoute.specs.get('text')
      expect(textRoute.primary).toBe('textPrimary')
      expect(textRoute.secondary).toEqual([])
      const eventRoute = rootRoute.specs.get('event')
      expect(eventRoute.primary).toBeUndefined()
      expect(eventRoute.secondary).toEqual(['event_secondary1', 'event_secondary2'])
      const clickRoute = eventRoute.specs.get('click')
      expect(clickRoute.secondary).toEqual(['datacube'])
    })
  })
})
