import * as chai from 'chai'
import Message from '../model/Message'
import ClientRouter from './ClientRouter'
import SimpleDataSource from './SimpleDataSource'
import stream = require('stream')
import fs = require('fs')
import * as _ from 'lodash'
import IDispatcher from './Dispatcher'
const Writable = stream.Writable
const Readable = stream.Readable
import * as proxyquire from 'proxyquire'
import EventEmitter = require('events')
import * as url from 'url'
const proxyquireStrict = proxyquire.noPreserveCache()
class FakeRequestExec extends EventEmitter {}
const expect = chai.expect

describe('Dispatcher', () => {
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
    it('should  create Dispatcher', () => {
      const Dispather = proxyquireStrict('./Dispatcher', {}).default
      const simpleDs = new SimpleDataSource(routesObj, clientsObj)
      const clientRouter = new ClientRouter(simpleDs)
      const dispatcher = new Dispather(clientRouter)
      expect(dispatcher).to.be.instanceof(Dispather)
    })
  })

  describe('#dispatch', () => {
    it('should dispatch message to target primary and secondary clients', (done) => {
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
      const expectCount = 7
      let count = 0
      const targetUrls = _.map(clientsObj, (item) => item.url)
      const secondaryUrls = _.map(clientsObj, (item) => item.url).filter((item) => {
        return item.indexOf('click') === -1
      })
      const debugStub = (name) => {
        if (name === 'wechat-distribute') {
          return (text, url) => {
            count++
          }
        }
      }
      const requestStub = {
        post: (url, options) => {
          expect(url.split('?')[0]).to.be.oneOf(targetUrls)
          count++
          if (count === expectCount) {
            done()
          }
          return url
        },
      }
      const Dispather = proxyquireStrict('./Dispatcher', {request: requestStub, debug: debugStub}).default
      const dispatcher: IDispatcher = new Dispather(clientRouter)

      const primaryUrl = 'http://main.com/click'
      const ctx: any = {
        search: '?param=search',
        set body(val) {
          expect(val).to.equal('http://main.com/click?param=search')
          count++
          if (count === expectCount) {
            done()
          }
        },
        onerror: () => {},
        req: {},
        res: {},
      }
      ctx.req.pipe  = (url) => {
        return {
          on: (event) => {},
          pipe: () => {
            return url
          },
        }
      }
      ctx.res.pipe =  (type, url) => {
        if (type === 'primary') {
          expect(url.split('?')[0]).to.equal(primaryUrl)
          count++
        } else {
          expect(url.split('?')[0]).to.be.oneOf(secondaryUrls)
          count++
        }
        if (count === expectCount) {
          done()
        }
      }
      dispatcher.dispatch(ctx, new Message(wxMsg))
    })
  })
})
