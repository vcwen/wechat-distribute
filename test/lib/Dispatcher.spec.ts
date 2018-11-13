import { Set } from 'immutable'
import _ from 'lodash'
import Constants from '../../src/lib/Constants'
import Dispatcher from '../../src/lib/Dispatcher'
import { Message, SimpleDataSource } from '../../src/main'

describe('Dispatcher', () => {
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
            event: 'primary'
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
  const datasource = new SimpleDataSource(accounts)

  describe('#constructor', () => {
    it('should  create Dispatcher', () => {
      const dispatcher = new Dispatcher(datasource)
      expect(dispatcher).toBeInstanceOf(Dispatcher)
    })
  })

  describe('#dispatch', () => {
    it('should dispatch message to target primary and secondary clients', (done) => {
      const dispatcher: any = new Dispatcher(datasource)
      let count = 0
      dispatcher._dispatchPrimary = async (_1, client) => {
        expect(client).toEqual('http://main.com/click')
        count += 1
        if (count === 2) {
          done()
        }
      }
      dispatcher._dispatchSecondary = async (_1, clients: Set<any>) => {
        expect(clients.toArray().sort()).toEqual(
          [
            'http://main.com/datacube',
            'http://main.com/event_secondary1',
            'http://main.com/event_secondary2',
            'http://main.com/test',
            'http://main.com/secondary'
          ].sort()
        )
        count += 1
        if (count === 2) {
          done()
        }
      }
      const context: any = {}
      const msg = new Message('from_user', 'wechat_id', Math.floor(Date.now() / 1000), 'event', Buffer.from('test'))
      msg.event = 'click'
      dispatcher.dispatch(context, msg)
    })
    it('should return empty string when primary is not present', async () => {
      const dispatcher: any = new Dispatcher(datasource)
      dispatcher._dispatchSecondary = async () => {
        // do nothing
      }
      const context: any = {
        set status(val) {
          expect(val).toEqual(200)
        },
        set body(val) {
          expect(val).toBe('')
        }
      }
      const msg = new Message('from_user', 'wechat_id', Math.floor(Date.now() / 1000), 'location', Buffer.from('test'))
      await dispatcher.dispatch(context, msg)
    })
  })
  describe('#_dispatchPrimary', () => {
    it('should call makeRequest with correct params', () => {
      const dispatcher: any = new Dispatcher(datasource)
      dispatcher._makeRequest = (client, message, options) => {
        expect(client).toEqual('primary')
        expect(message.rawXml.toString()).toEqual('<xml>buffer</xml>')
        expect(options.timeout).toEqual(Constants.PRIMARY_TIMEOUT)
      }
      dispatcher._dispatchPrimary({ rawXml: Buffer.from('<xml>buffer</xml>', 'utf8') }, 'primary', {
        timeout: Constants.PRIMARY_TIMEOUT
      })
    })
    it('should call makeRequest with correct params', () => {
      const dispatcher: any = new Dispatcher({} as any)
      dispatcher._makeRequest = (client, message, options) => {
        expect(client).toEqual('primary')
        expect(message.rawXml.toString()).toEqual('<xml>buffer</xml>')
        expect(options.timeout).toEqual(Constants.PRIMARY_TIMEOUT)
      }
      dispatcher._dispatchPrimary({ rawXml: Buffer.from('<xml>buffer</xml>', 'utf8') }, 'primary', {
        timeout: Constants.PRIMARY_TIMEOUT
      })
    })
  })
  describe('#dispatchSecondary', () => {
    it('should call makeRequest with correct params', () => {
      const dispatcher: any = new Dispatcher(datasource)
      dispatcher._makeRequest = (client, message, options) => {
        expect(client).toMatch(/secondaryUrl/)
        expect(message.rawXml.toString()).toEqual('<xml>buffer</xml>')
        expect(options.timeout).toEqual(Constants.SECONDARY_TIMEOUT)
      }
      dispatcher._dispatchSecondary(
        {
          rawXml: Buffer.from('<xml>buffer</xml>', 'utf8')
        },
        ['secondaryUrl_1', 'secondaryUrl_2'],
        {
          timeout: Constants.SECONDARY_TIMEOUT
        }
      )
    })
  })
})
