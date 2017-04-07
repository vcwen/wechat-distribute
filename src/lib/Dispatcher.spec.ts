import * as chai from 'chai'
import Message from '../model/Message'
import ClientRouter from './ClientRouter'
import SimpleDataSource from './SimpleDataSource'
import stream = require('stream')
import fs = require('fs')
import * as _ from 'lodash'

const Writable = stream.Writable
const Readable = stream.Readable
import  * as proxyquire from 'proxyquire'
import EventEmitter = require('events')
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
      const expectCount = 6
      let count = 0
      const secondaryUrls = _.map(clientsObj, (item) => item.url).filter((item) => {
        return item.indexOf('click') === -1
      })
      const debugStub = (name) => {
        if (name === 'wechat-router') {
          return (text, url) => {
            count++
            expect(url).to.be.oneOf(secondaryUrls)
            if (count === expectCount) {
              done()
            }
          }
        }
      }
      const requestStub = {
        post: (options, callback) => {
          const response: any = {
            pipe(target) {
              if (options.url.startsWith('http://main.com/click')) {
                target.pipe('primary', options.url)
              } else {
                target.pipe('secondary', options.url)
              }
            },
          }
          response.statusCode = 200
          const fakeReqExec = new FakeRequestExec()
          setTimeout(() => {
            fakeReqExec.emit('response', response)
          }, 1000)

          callback(null, response, '')
          return fakeReqExec
        },
      }
      const Dispather = proxyquireStrict('./Dispatcher', {request: requestStub, debug: debugStub}).default
      const dispatcher = new Dispather(clientRouter)
      const req = {
        weixin: wxMsg,
        originalUrl: 'http://test.wechat.com/test?name=1',
        rawBody: '<xml>',
      }

      const primaryUrl = 'http://main.com/click'

      const res: any = {}

      res.pipe =  (type, url) => {
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
      const next = (err) => {}
      dispatcher.dispatch(req, res, next)
    })
    it('should dispatch message to target primary and secondary clients when some of secondary have error', (done) => {
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
      const expectCount = 6
      let count = 0
      const secondaryUrls = _.map(clientsObj, (item) => item.url).filter((item) => {
        return item.indexOf('click') === -1
      })
      const debugStub = (name) => {
        if (name === 'wechat-router') {
          return (text, url) => {
            count++
            expect(url).to.be.oneOf(secondaryUrls)
            if (count === expectCount) {
              done()
            }
          }
        } else {
          return (text, error) => {
            count++
            expect(error).to.be.an('error')
            if (count === expectCount) {
              done()
            }
          }
        }
      }
      const requestStub = {
        post: (options, callback) => {
          const response: any = {
            pipe(target) {
              if (options.url.startsWith('http://main.com/click')) {
                target.pipe('primary', options.url)
              } else {
                target.pipe('secondary', options.url)
              }
            },
          }
          response.statusCode = 200
          const fakeReqExec = new FakeRequestExec()
          setTimeout(() => {
            fakeReqExec.emit('response', response)
          }, 1000)
          if (options.url.startsWith('http://main.com/datacube')) {
            callback(new Error('request error'), response, 'error message')
          } else {
             callback(null, response, 'xml body')
          }

          return fakeReqExec
        },
      }
      const Dispather = proxyquireStrict('./Dispatcher', {request: requestStub, debug: debugStub}).default
      const dispatcher = new Dispather(clientRouter)
      const req = {
        weixin: wxMsg,
        originalUrl: 'http://test.wechat.com/test?name=1',
        rawBody: '<xml>',
      }

      const primaryUrl = 'http://main.com/click'

      const res: any = {}

      res.pipe =  (type, url) => {
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
      const next = (err) => {}
      dispatcher.dispatch(req, res, next)
    })
    it('should dispatch message to target  secondary clients when primary has error', (done) => {
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
      const expectCount = 6
      let count = 0
      const secondaryUrls = _.map(clientsObj, (item) => item.url).filter((item) => {
        return item.indexOf('click') === -1
      })
      const debugStub = (name) => {
        if (name === 'wechat-router') {
          return (text, url) => {
            count++
            expect(url).to.be.oneOf(secondaryUrls)
            if (count === expectCount) {
              done()
            }
          }
        } else {
          return (text, error) => {
            count++
            expect(error).to.be.an('error')
            if (count === expectCount) {
              done()
            }
          }
        }
      }
      const requestStub = {
        post: (options, callback) => {
          const response: any = {
            pipe(target) {
              if (options.url.startsWith('http://main.com/click')) {
                target.pipe('primary', options.url)
              } else {
                target.pipe('secondary', options.url)
              }
            },
          }
          response.statusCode = 200
          const fakeReqExec = new FakeRequestExec()
          setTimeout(() => {
            fakeReqExec.emit('response', response)
          }, 1000)
          if (options.url.startsWith('http://main.com/click')) {
            callback(new Error('request error'), response, 'error message')
          } else {
             callback(null, response, 'xml body')
          }

          return fakeReqExec
        },
      }
      const Dispather = proxyquireStrict('./Dispatcher', {request: requestStub, debug: debugStub}).default
      const dispatcher = new Dispather(clientRouter)
      const req = {
        weixin: wxMsg,
        originalUrl: 'http://test.wechat.com/test?name=1',
        rawBody: '<xml>',
      }

      const primaryUrl = 'http://main.com/click'

      const res: any = {}

      res.pipe =  (type, url) => {
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
      res.sendStatus = (statusCode) => {
         expect(statusCode).to.equal(500)
       }
      const next = (err) => {}
      dispatcher.dispatch(req, res, next)
    })

    it('should dispatch message to target secondary clients and fallback to next when primary is not present',
      (done) => {
      const noPrimaryRoutesObj: any = {
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
      const simpleDs = new SimpleDataSource(noPrimaryRoutesObj, clientsObj)
      const clientRouter = new ClientRouter(simpleDs)
      const wxMsg =  {
        ToUserName: 'gh_188612cc13bf',
        FromUserName: 'ouIpDs1npAsCTtjcQ_ERI3LRpfIQ',
        CreateTime: 1487248700,
        MsgType: 'event',
        Event: 'CLICK',
        EventKey: 'article_57d114fc16a64320b2b48a0f',
      }
      const expectCount = 5
      let count = 0
      const secondaryUrls = _.map(clientsObj, (item) => item.url).filter((item) => {
        return item.indexOf('click') === -1
      })
      const debugStub = (name) => {
        if (name === 'wechat-router') {
          return (text, url) => {
            count++
            expect(url).to.be.oneOf(secondaryUrls)
            if (count === expectCount) {
              done()
            }
          }
        } else {
          return (text, error) => {
            count++
            expect(error).to.be.an('error')
            if (count === expectCount) {
              done()
            }
          }
        }
      }
      const requestStub = {
        post: (options, callback) => {
          const response: any = {
            pipe(target) {
              if (options.url.startsWith('http://main.com/click')) {
                target.pipe('primary', options.url)
              } else {
                target.pipe('secondary', options.url)
              }
            },
          }
          response.statusCode = 200
          const fakeReqExec = new FakeRequestExec()
          setTimeout(() => {
            fakeReqExec.emit('response', response)
          }, 1000)
          if (options.url.startsWith('http://main.com/click')) {
            callback(new Error('request error'), response, 'error message')
          } else {
             callback(null, response, 'xml body')
          }

          return fakeReqExec
        },
      }
      const Dispather = proxyquireStrict('./Dispatcher', {request: requestStub, debug: debugStub}).default
      const dispatcher = new Dispather(clientRouter)
      const req = {
        weixin: wxMsg,
        originalUrl: 'http://test.wechat.com/test?name=1',
        rawBody: '<xml>',
      }

      const primaryUrl = 'http://main.com/click'

      const res: any = {}

      res.pipe =  (type, url) => {
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
      res.sendStatus = (statusCode) => {
         expect(statusCode).to.equal(500)
       }
      const next = (err) => {
        expect(err).to.be.undefined
        count++
        if (count === expectCount) {
          done()
        }
      }
      dispatcher.dispatch(req, res, next)
    })
  })
})
