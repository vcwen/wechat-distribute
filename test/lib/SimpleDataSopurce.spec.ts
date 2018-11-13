import SimpleDataSource from '../../src/lib/SimpleDataSource'

describe('SimpleDataSource', () => {
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
    it('should  create SimpleDataSource', () => {
      const simpleDs = new SimpleDataSource(accounts)
      expect(simpleDs).toBeInstanceOf(SimpleDataSource)
    })
  })

  describe('#getClients', () => {
    it('should return clients', async () => {
      const simpleDs = new SimpleDataSource(accounts)
      const clients = simpleDs.getClientsByWechatId('wechat_id')
      expect(clients.size).toBe(7)
    })
  })
})
