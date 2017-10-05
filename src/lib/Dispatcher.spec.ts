import * as chai from 'chai'
import fs = require('fs')
import * as _ from 'lodash'
import stream = require('stream')
import Client from '../model/Client'
import Message from '../model/Message'
import ClientRouter from './ClientRouter'
import Dispatcher from './Dispatcher'
import SimpleDataSource from './SimpleDataSource'
const Writable = stream.Writable
const Readable = stream.Readable
import EventEmitter = require('events')
import * as proxyquire from 'proxyquire'
import * as url from 'url'
import Constants from './constants'
const proxyquireStrict = proxyquire.noPreserveCache()
class FakeRequestExec extends EventEmitter {}
const expect = chai.expect

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
      expect(dispatcher).to.be.instanceof(Dispatcher)
    })
  })

  describe('#dispatch', () => {
    it('should dispatch message to target primary and secondary clients', (done) => {

      const targetUrls = _.map(clientsObj, (item) => item.url)
      const secondaryUrls = _.map(clientsObj, (item) => item.url).filter((item) => {
        return item.indexOf('click') === -1
      })

      const dispatcher: Dispatcher = new Dispatcher({} as any);
      (dispatcher as any).clientRouter = {
        async getClients(message) {
          return ['http://main.com/click', secondaryUrls]
        }
      };
      (dispatcher as any).dispatchPrimary = async (ctx, client, message) => {
        expect(client).to.equal('http://main.com/click')
      }
      (dispatcher as any).dispatchSecondary = async (ctx, clients, message) => {
        expect(clients).to.equal(secondaryUrls)
        done()
      }
      const ctx: any = {}
      dispatcher.dispatch(ctx, {} as any)
    })
    it('should return 404 when primary is not present', (done) => {
      const dispatcher = new Dispatcher({} as any)
      const targetUrls = _.map(clientsObj, (item) => item.url)
      const secondaryUrls = _.map(clientsObj, (item) => item.url).filter((item) => {
        return item.indexOf('click') === -1
      });
      (dispatcher as any).clientRouter = {
        async getClients(message) {
          return ['', secondaryUrls]
        }
      };
      (dispatcher as any).dispatchPrimary = async (ctx, client) => {
        expect(client).to.equal('http://main.com/click')
      }
      (dispatcher as any).dispatchSecondary = async (ctx, clients) => {
        expect(clients).to.equal(secondaryUrls)
        done()
      }
      const context: any = {
        set status(val) {
          expect(val).to.equal(404)
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
        expect(ctx).to.equal(context)
        expect(client).to.equal('primary')
        expect(message.rawXml.toString()).to.equal('<xml>buffer</xml>')
        expect(isPrimary).to.equal(true)
        expect(timeout).to.equal(Constants.PRIMARY_TIMEOUT)
      }
      dispatcher.dispatchPrimary(context, 'primary', {rawXml: Buffer.from('<xml>buffer</xml>', 'utf8')})
    })
    it('should call makeRequest with correct params', () => {
      const dispatcher: any = new Dispatcher({} as any)
      const context: any = {};
      (dispatcher as any).makeRequest =  (ctx, client, message, isPrimary, timeout) => {
        expect(ctx).to.equal(context)
        expect(client).to.equal('primary')
        expect(message.rawXml.toString()).to.equal('<xml>buffer</xml>')
        expect(isPrimary).to.equal(true)
        expect(timeout).to.equal(Constants.PRIMARY_TIMEOUT)
      }
      dispatcher.dispatchPrimary(context, 'primary', {rawXml: Buffer.from('<xml>buffer</xml>', 'utf8')})
    })
  })
  describe('#dispatchSecondary', () => {
    it('should call makeRequest with correct params', () => {
      const dispatcher: any = new Dispatcher({} as any)
      const context: any = {};
      (dispatcher as any).makeRequest =  (ctx, client, message, isPrimary, timeout) => {
        expect(ctx).to.equal(context)
        expect(client).to.be.oneOf(['secondaryUrl_1', 'secondaryUrl_2'])
        expect(message.rawXml.toString()).to.equal('<xml>buffer</xml>')
        expect(isPrimary).to.equal(false)
        expect(timeout).to.equal(Constants.SECONDARY_TIMEOUT)
      }
      dispatcher.dispatchSecondary(context, ['secondaryUrl_1', 'secondaryUrl_2'],
        {rawXml: Buffer.from('<xml>buffer</xml>', 'utf8')})
    })
  })
})
