import { Readable } from 'stream'
import MessageRouter from '../../src/lib/MessageRouter'
import { getSignature } from '../../src/lib/utils'
import { WXBizMsgCrypt } from '../../src/lib/WXBizMsgCrypt'
import { SimpleDataSource } from '../../src/main'
import WechatAccount from '../../src/model/WechatAccount'
import MessageHelper from './MessageHelper'

describe('MessageRouter', () => {
  const datasource = new SimpleDataSource({
    test: {
      appId: 'appId',
      name: 'account_name',
      wechatId: 'wechat_id',
      appSecret: 'appSecret',
      encodingAESKey: '4nrPbcFEKJE8AH3b2chrqbmf7txGi8S0mmBSbycnTee',
      token: 'token',
      clients: {
        click: {
          url: 'http://main.com/click',
          interests: {
            'event.click': 'primary'
          }
        }
      }
    }
  })
  describe('#constructor', () => {
    it('should create MessageRouter', () => {
      const router = new MessageRouter(datasource)
      expect(router).toBeInstanceOf(MessageRouter)
    })
  })
  describe('#middlewarify', () => {
    it('should return echostr for unencrypted validation', (done) => {
      const account = new WechatAccount(
        'app',
        'wechat_id',
        'appId',
        'secret',
        '4nrPbcFEKJE8AH3b2chrqbmf7txGi8S0mmBSbycnTee',
        'token'
      )
      const router = new MessageRouter(datasource)
      const signature = getSignature(1499158830, 'nonce', account.token)
      const context = {
        method: 'GET',
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          echostr: 'echoecho',
          signature
        },
        params: {
          appId: 'appId'
        },
        originalUrl: '/wechat/appId',
        set body(val) {
          expect(val).toEqual('echoecho')
          done()
        }
      }
      router.middlewarify()(context as any)
    })
    it('should return 401 when validation failed', (done) => {
      const router = new MessageRouter(datasource)
      const context = {
        method: 'GET',
        params: {
          appId: 'appId'
        },
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          echostr: 'echoecho'
        },
        originalUrl: '/wechat/appId',
        throw(code) {
          expect(code).toEqual(401)
          done()
        }
      }
      router.middlewarify()(context as any)
    })
    it('should return 401 when unencrypted notification has invalid signature', (done) => {
      const router = new MessageRouter(datasource)
      const context = {
        method: 'POST',
        params: {
          appId: 'appId'
        },
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          echostr: 'echoecho',
          signature: '1499158830nonceechoecho'
        },
        originalUrl: '/wechat/appId',
        throw(code) {
          expect(code).toBe(401)
          done()
        }
      }
      router.middlewarify()(context as any)
    })
    it('should dispatch  message if everything is good', (done) => {
      const account = new WechatAccount(
        'app',
        'wechat_id',
        'appId',
        'secret',
        '4nrPbcFEKJE8AH3b2chrqbmf7txGi8S0mmBSbycnTee',
        'token'
      )
      const router: any = new MessageRouter(datasource)
      router.dispatcher = {
        dispatch(_, message) {
          expect(message.msgType).toBe('event')
          expect(message.event).toBe('click')
          expect(message.eventKey).toBe('event_key_123')
          done()
        }
      }
      const cryptor = new WXBizMsgCrypt(account.token, account.encodingAESKey, account.appId)
      const msg = `<xml>
      <ToUserName><![CDATA[jay]]></ToUserName>
      <FromUserName><![CDATA[vincent]]></FromUserName>
      <CreateTime>1499158830</CreateTime>
      <MsgType><![CDATA[event]]></MsgType>
      <Event><![CDATA[CLICK]]></Event>
      <EventKey><![CDATA[event_key_123]]></EventKey>
      </xml>`
      const content = MessageHelper.encryptMessage(cryptor.encrypt(msg))
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
      const regex = new RegExp('\\[CDATA\\[(.+)\\]\\]')
      const match: any = regex.exec(content)
      const signature = cryptor.getSignature('1499158830', 'nonce', match[1])
      const readable = new MyReadable()
      const context = {
        method: 'POST',
        params: {
          appId: 'appId'
        },
        length: len,
        req: readable,
        originalUrl: '/wechat/appId',
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          msg_signature: signature,
          encrypt_type: 'aes'
        },
        throw(code: number, message: string) {
          // tslint:disable-next-line:no-console
          console.log(`code:${code}-- ${message}`)
        }
      }
      router.middlewarify()(context as any)
    })
    it('should return 501 if method is not GET or POST', (done) => {
      const router = new MessageRouter(datasource)
      const context = {
        method: 'PUT',
        params: {
          appId: 'appId'
        },
        query: {
          timestamp: 1499158830,
          nonce: 'nonce',
          echostr: 'echoecho',
          signature: 'unencrypted_signature'
        },
        originalUrl: '/wechat/appId',
        throw(code) {
          expect(code).toEqual(501)
          done()
        }
      }
      router.middlewarify()(context as any)
    })
  })
})
