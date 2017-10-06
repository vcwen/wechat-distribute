import * as chai from 'chai'
import * as fs from 'fs'
import * as Koa from 'koa'
import * as _ from 'lodash'
import stream = require('stream')
import * as WechatCrypto from 'wechat-crypto'
import Message from '../model/Message'
import WechatAccount from '../model/WechatAccount'
import ClientRouter from './ClientRouter'
import DataSource from './DataSource'
import Dispatcher from './Dispatcher'
import Helper from './Helper'
import MessageRouter from './MessageRouter'
import SimpleDataSource from './SimpleDataSource'
const Writable = stream.Writable
const Readable = stream.Readable
import EventEmitter = require('events')
import * as proxyquire from 'proxyquire'
import * as url from 'url'
import Constants from './constants'
const proxyquireStrict = proxyquire.noCallThru()
class FakeRequestExec extends EventEmitter {}
const expect = chai.expect

describe('MessageRouter', () => {
  describe('#constructor', () => {
    it('should create MessageRouter', () => {
      const account = new WechatAccount('app', 'appId', 'secret',
        'REmXC07Twr6ssl9tCt4KJJTiTzqZyC1cHRltLmntZbe', 'token')
      const router = new MessageRouter(account, {} as any)
      expect(router).to.be.instanceof(MessageRouter)
    })
  })
  describe('#middlewarify', () => {
    it('should return echostr for unencrypted validation', (done) => {
      class WechatCryptoStub {}
      const HelperStub = {
        default: {
          getSignature() {
            return 'unencrypted_signature'
          }
        }
      }
      const IMessageRouter = proxyquireStrict('./MessageRouter',
        {'wechat-crypto': WechatCryptoStub, './Helper': HelperStub}).default
      const account = new WechatAccount('app', 'appId', 'secret',
        'REmXC07Twr6ssl9tCt4KJJTiTzqZyC1cHRltLmntZbe', 'token')
      const router = new IMessageRouter(account, {} as any)
      const context = {
        method: 'GET',
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          echostr: 'echoecho',
          signature: 'unencrypted_signature'
        },
        set body(val) {
          expect(val).to.equal('echoecho')
          done()
        }
      }
      router.middlewarify()(context as any)
    })
    it('should return echostr for encrypted validation', (done) => {
      const WechatCryptoStub = function() {
        return {
          getSignature(timestamp, nonce, echostr) {
            return timestamp + '' + nonce + echostr
          },
          decrypt(echostr) {
            return {message: echostr}
          }
        }
      }
      const HelperStub = {
        default: {
          getSignature() {
            return 'unencrypted_signature'
          }
        }
      }
      const IMessageRouter = proxyquireStrict('./MessageRouter',
        {'wechat-crypto': WechatCryptoStub, './Helper': HelperStub}).default
      const account = new WechatAccount('app', 'appId', 'secret',
        'REmXC07Twr6ssl9tCt4KJJTiTzqZyC1cHRltLmntZbe', 'token')
      const router = new IMessageRouter(account, {} as any)
      const context = {
        method: 'GET',
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          echostr: 'echoecho',
          msg_signature: '1499158830nonceechoecho',
          encrypt_type: 'aes'
        },
        set body(val) {
          expect(val).to.equal('echoecho')
          done()
        }
      }
      router.middlewarify()(context as any)
    })
    it('should return 401 when validation failed', (done) => {
      const WechatCryptoStub = function() {
        return {
          getSignature(timestamp, nonce, echostr) {
            return 'encrypted_signature'
          },
          decrypt(echostr) {
            return {message: echostr}
          }
        }
      }
      const HelperStub = {
        default: {
          getSignature() {
            return 'unencrypted_signature'
          }
        }
      }
      const IMessageRouter = proxyquireStrict('./MessageRouter',
        {'wechat-crypto': WechatCryptoStub, './Helper': HelperStub}).default
      const account = new WechatAccount('app', 'appId', 'secret',
        'REmXC07Twr6ssl9tCt4KJJTiTzqZyC1cHRltLmntZbe', 'token')
      const router = new IMessageRouter(account, {} as any)
      const context = {
        method: 'GET',
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          echostr: 'echoecho',
          msg_signature: '1499158830nonceechoecho',
          encrypt_type: 'aes'
        },
        throw(code, msg) {
          expect(code).to.equal(401)
          done()
        }
      }
      router.middlewarify()(context as any)
    })
    it('should return 401 when unencrypted notification has invalid signature', (done) => {
      const WechatCryptoStub = function() {
        return {
          getSignature(timestamp, nonce, echostr) {
            return 'encrypted_signature'
          },
          decrypt(echostr) {
            return {message: echostr}
          }
        }
      }
      const HelperStub = {
        default: {
          getSignature() {
            return 'unencrypted_signature'
          }
        }
      }
      const IMessageRouter = proxyquireStrict('./MessageRouter',
        {'wechat-crypto': WechatCryptoStub, './Helper': HelperStub}).default
      const account = new WechatAccount('app', 'appId', 'secret',
        'REmXC07Twr6ssl9tCt4KJJTiTzqZyC1cHRltLmntZbe', 'token')
      const router = new IMessageRouter(account, {} as any)
      const context = {
        method: 'POST',
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          echostr: 'echoecho',
          signature: '1499158830nonceechoecho'
        },
        throw(code, msg) {
          expect(code).to.equal(401)
          done()
        }
      }
      router.middlewarify()(context as any)
    })
    it('should dispatch  message if everything is good', (done) => {
      const WechatCryptoStub = function() {
        return {
          getSignature(timestamp, nonce, echostr) {
            return 'encrypted_signature'
          },
          decrypt(echostr) {
            return {message: echostr}
          }
        }
      }
      const HelperStub = {
        default: {
          getSignature() {
            return 'unencrypted_signature'
          },
          async extractWechatMessage(ctx, encrypted) {
            return {type: 'event', eventKey: 'event_key'}
          }
        }
      }
      const IMessageRouter = proxyquireStrict('./MessageRouter',
        {'wechat-crypto': WechatCryptoStub, './Helper': HelperStub}).default
      const account = new WechatAccount('app', 'appId', 'secret',
        'REmXC07Twr6ssl9tCt4KJJTiTzqZyC1cHRltLmntZbe', 'token')
      const router = new IMessageRouter(account, {} as any)
      router.dispatcher = {
        dispatch(ctx, message) {
          expect(message).to.deep.equal({type: 'event', eventKey: 'event_key'})
          done()
        }
      }
      const context = {
        method: 'POST',
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          echostr: 'echoecho',
          signature: 'unencrypted_signature'
        }
      }
      router.middlewarify()(context as any)
    })
    it('should return 501 if method is not GET or POSt', (done) => {
      const WechatCryptoStub = function() {
        return {
          getSignature(timestamp, nonce, echostr) {
            return 'encrypted_signature'
          },
          decrypt(echostr) {
            return {message: echostr}
          }
        }
      }
      const HelperStub = {
        default: {
          getSignature() {
            return 'unencrypted_signature'
          },
          async extractWechatMessage(ctx, encrypted) {
            return {type: 'event', eventKey: 'event_key'}
          }
        }
      }
      const IMessageRouter = proxyquireStrict('./MessageRouter',
        {'wechat-crypto': WechatCryptoStub, './Helper': HelperStub}).default
      const account = new WechatAccount('app', 'appId', 'secret',
        'REmXC07Twr6ssl9tCt4KJJTiTzqZyC1cHRltLmntZbe', 'token')
      const router = new IMessageRouter(account, {} as any)
      const context = {
        method: 'PUT',
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          echostr: 'echoecho',
          signature: 'unencrypted_signature'
        },
        throw(code, msg) {
          expect(code).to.equal(501)
          done()
        }
      }
      router.middlewarify()(context as any)
    })
  })
})
