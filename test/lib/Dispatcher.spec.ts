import * as _ from 'lodash'
import Constants from '../../src/lib/Constants'
import Dispatcher from '../../src/lib/Dispatcher'

describe('Dispatcher', () => {
  const clientsObj = {
        main: {
          url: 'http://main.com/test'
        },
        secondary: {
          url: 'http://main.com/secondary'
        },
        textPrimary: {
          url: 'http://main.com/textPrimary'
        },
        event_secondary1: {
          url: 'http://main.com/event_secondary1'
        },
        event_secondary2: {
          url: 'http://main.com/event_secondary2'
        },
        datacube: {
          url: 'http://main.com/datacube'
        },
        click: {
          url: 'http://main.com/click'
        }
      }
  describe('#constructor', () => {
    it('should  create Dispatcher', () => {
      const dispatcher = new Dispatcher({} as any)
      expect(dispatcher).toBeInstanceOf(Dispatcher)
    })
  })

  describe('#dispatch', () => {
    it('should dispatch message to target primary and secondary clients', (done) => {
      const secondaryUrls = _.map(clientsObj, (item) => item.url).filter((item) => {
        return item.indexOf('click') === -1
      })

      const dispatcher: Dispatcher = new Dispatcher({} as any);
      (dispatcher as any).clientRouter = {
        async getClients() {
          return ['http://main.com/click', secondaryUrls]
        }
      };
      (dispatcher as any).dispatchPrimary = async (_1, client) => {
        expect(client).toEqual('http://main.com/click')
      }
      (dispatcher as any).dispatchSecondary = async (_1, clients) => {
        expect(clients).toEqual(secondaryUrls)
        done()
      }
      const context: any = {}
      dispatcher.dispatch(context, {} as any)
    })
    it('should return 404 when primary is not present', (done) => {
      const dispatcher = new Dispatcher({} as any)
      const secondaryUrls = _.map(clientsObj, (item) => item.url).filter((item) => {
        return item.indexOf('click') === -1
      });
      (dispatcher as any).clientRouter = {
        async getClients() {
          return ['', secondaryUrls]
        }
      };
      (dispatcher as any).dispatchPrimary = async (_1, client) => {
        expect(client).toEqual('http://main.com/click')
      }
      (dispatcher as any).dispatchSecondary = async (_1, clients) => {
        expect(clients).toEqual(secondaryUrls)
        done()
      }
      const context: any = {
        set status(val) {
          expect(val).toEqual(404)
        }
      }
      dispatcher.dispatch(context, {} as any)
    })
  })
  describe('#dispatchPrimary', () => {
    it('should call makeRequest with correct params', () => {
      const dispatcher: any = new Dispatcher({} as any)
      const context: any = {};
      (dispatcher as any).makeRequest =  (ctx, client, message, isPrimary, timeout) => {
        expect(ctx).toEqual(context)
        expect(client).toEqual('primary')
        expect(message.rawXml.toString()).toEqual('<xml>buffer</xml>')
        expect(isPrimary).toEqual(true)
        expect(timeout).toEqual(Constants.PRIMARY_TIMEOUT)
      }
      dispatcher.dispatchPrimary(context, 'primary', {rawXml: Buffer.from('<xml>buffer</xml>', 'utf8')})
    })
    it('should call makeRequest with correct params', () => {
      const dispatcher: any = new Dispatcher({} as any)
      const context: any = {};
      (dispatcher as any).makeRequest =  (ctx, client, message, isPrimary, timeout) => {
        expect(ctx).toEqual(context)
        expect(client).toEqual('primary')
        expect(message.rawXml.toString()).toEqual('<xml>buffer</xml>')
        expect(isPrimary).toEqual(true)
        expect(timeout).toEqual(Constants.PRIMARY_TIMEOUT)
      }
      dispatcher.dispatchPrimary(context, 'primary', {rawXml: Buffer.from('<xml>buffer</xml>', 'utf8')})
    })
  })
  describe('#dispatchSecondary', () => {
    it('should call makeRequest with correct params', () => {
      const dispatcher: any = new Dispatcher({} as any)
      const context: any = {};
      (dispatcher as any).makeRequest =  (ctx, client, message, isPrimary, timeout) => {
        expect(ctx).toEqual(context)
        expect(client).toMatch(/secondaryUrl/)
        expect(message.rawXml.toString()).toEqual('<xml>buffer</xml>')
        expect(isPrimary).toEqual(false)
        expect(timeout).toEqual(Constants.SECONDARY_TIMEOUT)
      }
      dispatcher.dispatchSecondary(context, ['secondaryUrl_1', 'secondaryUrl_2'],
        {rawXml: Buffer.from('<xml>buffer</xml>', 'utf8')})
    })
  })
})
