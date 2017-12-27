import SimpleDataSource from '../../src/lib/SimpleDataSource'

describe('SimpleDataSource', () => {
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
    it('should  create SimpleDataSource', () => {
      const simpleDs = new SimpleDataSource(clientsObj)
      expect(simpleDs).toBeInstanceOf(SimpleDataSource)
    })
  })

  describe('#getClients', () => {
    it('should return clients', async () => {
      const simpleDs = new SimpleDataSource(clientsObj)
      const clients = simpleDs.getClients()
      expect(clients.size).toBe(7)
    })
  })

  describe('#getRoutes', () => {
    it('should return routes ', async () => {
      const simpleDs = new SimpleDataSource(clientsObj)
      const routes = await simpleDs.getRoutes()
      expect(routes.size).toBe(7)
    })
  })
})
