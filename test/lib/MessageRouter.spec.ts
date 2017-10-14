import { Readable } from 'stream'
import * as WechatCrypto from 'wechat-crypto'
import Helper from '../../src/lib/Helper'
import MessageRouter from '../../src/lib/MessageRouter'
import WechatAccount from '../../src/model/WechatAccount'
import MessageHelper from './MessageHelper'

describe('MessageRouter', () => {
  describe('#constructor', () => {
    it('should create MessageRouter', () => {
      const account = new WechatAccount('app', 'appId', 'secret',
        'REmXC07Twr6ssl9tCt4KJJTiTzqZyC1cHRltLmntZbe', 'token')
      const router = new MessageRouter(account, {} as any)
      expect(router).toBeInstanceOf(MessageRouter)
    })
  })
  describe('#middlewarify', () => {
    it('should return echostr for unencrypted validation', (done) => {
      const account = new WechatAccount('app', 'appId', 'secret',
        'REmXC07Twr6ssl9tCt4KJJTiTzqZyC1cHRltLmntZbe', 'token')
      const router = new MessageRouter(account, {} as any)
      const signature = Helper.getSignature(1499158830, 'nonce', account.token)
      const context = {
        method: 'GET',
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          echostr: 'echoecho',
          signature
        },
        set body(val) {
          expect(val).toEqual('echoecho')
          done()
        }
      }
      router.middlewarify()(context as any)
    })
    it('should return echostr for encrypted validation', (done) => {
      const account = new WechatAccount('app', 'appId', 'secret',
        'REmXC07Twr6ssl9tCt4KJJTiTzqZyC1cHRltLmntZbe', 'token')
      const router = new MessageRouter(account, {} as any)
      const cryptor = new WechatCrypto(account.token, account.encodingAESKey, account.appId)
      const echostr = cryptor.encrypt('echoecho')
      const signature = cryptor.getSignature(1499158830, 'nonce', echostr)
      const context = {
        method: 'GET',
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          echostr,
          msg_signature: signature,
          encrypt_type: 'aes'
        },
        set body(val) {
          expect(val).toEqual('echoecho')
          done()
        }
      }
      router.middlewarify()(context as any)
    })
    it('should return 401 when validation failed', (done) => {
      const account = new WechatAccount('app', 'appId', 'secret',
        'REmXC07Twr6ssl9tCt4KJJTiTzqZyC1cHRltLmntZbe', 'token')
      const router = new MessageRouter(account, {} as any)
      const context = {
        method: 'GET',
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          echostr: 'echoecho',
          msg_signature: '1499158830nonceechoecho',
          encrypt_type: 'aes'
        },
        throw(code) {
          expect(code).toEqual(401)
          done()
        }
      }
      router.middlewarify()(context as any)
    })
    it('should return 401 when unencrypted notification has invalid signature', (done) => {
      const account = new WechatAccount('app', 'appId', 'secret',
        'REmXC07Twr6ssl9tCt4KJJTiTzqZyC1cHRltLmntZbe', 'token')
      const router = new MessageRouter(account, {} as any)
      const context = {
        method: 'POST',
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          echostr: 'echoecho',
          signature: '1499158830nonceechoecho'
        },
        throw(code) {
          expect(code).toBe(401)
          done()
        }
      }
      router.middlewarify()(context as any)
    })
    it('should dispatch  message if everything is good', (done) => {
      const account = new WechatAccount('app', 'appId', 'secret',
        'REmXC07Twr6ssl9tCt4KJJTiTzqZyC1cHRltLmntZbe', 'token')
      const router: any = new MessageRouter(account, {} as any)
      router.dispatcher = {
        dispatch(_, message) {
          expect(message.msgType).toBe('event')
          expect(message.event).toBe('click')
          expect(message.eventKey).toBe('event_key_123')
          done()
        }
      }
      const cryptor = new WechatCrypto(account.token, account.encodingAESKey, account.appId)
      const msg = `<xml>
      <ToUserName><![CDATA[jay]]></ToUserName>
      <FromUserName><![CDATA[vincent]]></FromUserName>
      <CreateTime>1499158830</CreateTime>
      <MsgType><![CDATA[event]]></MsgType>
      <Event><![CDATA[CLICK]]></Event>
      <EventKey><![CDATA[event_key_123]]></EventKey>
      </xml>`
      const content = MessageHelper.encryptMessage(cryptor, msg)
      const len = Buffer.byteLength(content)

      // tslint:disable-next-line:max-classes-per-file
      class MyReadable extends Readable {
        public done: boolean
        constructor() {
          super()
          this.done = false
        }
        public _read() {
          if (!this.done) {
            this.push(content)
            this.done = true
          } else {
            return this.push(null)
          }
        }
      }
      const regex  = new RegExp('\\[CDATA\\[(.+)\\]\\]')
      const match = regex.exec(content)
      const signature  = cryptor.getSignature(1499158830, 'nonce', match[1])
      const readable = new MyReadable()
      const context = {
        method: 'POST',
        length: len,
        req: readable,
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          msg_signature: signature,
          encrypt_type: 'aes'
        }
      }
      router.middlewarify()(context as any)
    })
    it('should return 501 if method is not GET or POST', (done) => {
      const account = new WechatAccount('app', 'appId', 'secret',
        'REmXC07Twr6ssl9tCt4KJJTiTzqZyC1cHRltLmntZbe', 'token')
      const router = new MessageRouter(account, {} as any)
      const context = {
        method: 'PUT',
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          echostr: 'echoecho',
          signature: 'unencrypted_signature'
        },
        throw(code) {
          expect(code).toEqual(501)
          done()
        }
      }
      router.middlewarify()(context as any)
    })
  })
})
