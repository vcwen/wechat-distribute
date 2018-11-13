import wechat from 'co-wechat'
import http from 'http'
import Koa from 'koa'
import Router from 'koa-router'
import qs from 'querystring'
import superttset from 'supertest'
import { WechatMessage } from 'wechat-message-mock'
import { parseXML } from '../src/lib/utils'
import { WXBizMsgCrypt } from '../src/lib/WXBizMsgCrypt'
import { MessageRouter, SimpleDataSource } from '../src/main'
import MessageHelper from './lib/MessageHelper'

const config = {
  token: 'token',
  appid: 'appId',
  encodingAESKey: '4nrPbcFEKJE8AH3b2chrqbmf7txGi8S0mmBSbycnTee'
}
const app = new Koa()

const router = new Router()
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
        url: 'http://localhost:5000/click',
        interests: {
          'event.click': 'secondary'
        }
      },
      click: {
        url: 'http://localhost:4000/click',
        interests: {
          'event.click': 'primary'
        }
      }
    }
  }
}

const datasource = new SimpleDataSource(accounts)
const messageRouter = new MessageRouter(datasource)
router.all('/wechat/:appId', messageRouter.middlewarify())

app.use(router.routes() as any).use(router.allowedMethods() as any)
const timestamp = Math.floor(Date.now() / 1000)
const wxMsg = new WechatMessage(
  'event',
  { eventKey: 'event_key_123', toUserName: 'wechat_id', fromUserName: 'vincent', timestamp },
  'CLICK'
)

describe('wechat-distributor', () => {
  it('should be able to distibute plain text message to clients.', (done) => {
    const server = app.listen()
    const request = superttset(server)
    const appPrimary = new Koa()
    const appSecondary = new Koa()
    let primaryServer: http.Server
    let secondaryServer: http.Server
    appPrimary.use(
      wechat(config).middleware(async () => {
        return 'hehe'
      })
    )
    primaryServer = appPrimary.listen(4000, () => {
      appSecondary.use(
        wechat(config).middleware(async (message) => {
          expect(message).toEqual(
            expect.objectContaining({
              ToUserName: 'wechat_id',
              FromUserName: 'vincent',
              MsgType: 'event',
              Event: 'CLICK',
              EventKey: 'event_key_123'
            })
          )
        })
      )
      secondaryServer = appSecondary.listen(5000)
    })

    const nonce = MessageHelper.generateNonce()
    const signature = MessageHelper.generateSignature(config.token, nonce, timestamp)
    request
      .post(`/wechat/appId?` + qs.stringify({ nonce, timestamp, signature }))
      .set('Content-Type', 'application/xml')
      .send(wxMsg.toXmlFormat())
      .expect(200)
      .end(async (_, res) => {
        const { xml: reply } = await parseXML(res.body.toString())
        expect(reply.msgType).toEqual('text')
        expect(reply.content).toEqual('hehe')
        primaryServer.close(() => {
          secondaryServer.close(() => {
            server.close()
            done()
          })
        })
      })
  })
  it('should be able to distibute encrypted message to clients.', (done) => {
    const server = app.listen()
    const request = superttset(server)
    const appPrimary = new Koa()
    const appSecondary = new Koa()
    let primaryServer: http.Server
    let secondaryServer: http.Server
    appPrimary.use(
      wechat(config).middleware(async () => {
        return 'hehe'
      })
    )
    primaryServer = appPrimary.listen(4000, () => {
      appSecondary.use(
        wechat(config).middleware(async (message) => {
          expect(message).toEqual(
            expect.objectContaining({
              ToUserName: 'wechat_id',
              FromUserName: 'vincent',
              MsgType: 'event',
              Event: 'CLICK',
              EventKey: 'event_key_123'
            })
          )
        })
      )
      secondaryServer = appSecondary.listen(5000)
    })

    const nonce = MessageHelper.generateNonce()
    const cryptor = new WXBizMsgCrypt(config.token, config.encodingAESKey, config.appid)
    const msgXml = wxMsg.toXmlFormat()
    const encryptedXml = cryptor.encrypt(msgXml)
    // tslint:disable-next-line:variable-name
    const msg_signature = cryptor.getSignature(timestamp.toString(), nonce, encryptedXml)
    const encryptedMsg = MessageHelper.encryptMessage(encryptedXml)
    request
      .post(`/wechat/appId?` + qs.stringify({ nonce, timestamp, msg_signature, encrypt_type: 'aes' }))
      .set('Content-Type', 'application/xml')
      .send(encryptedMsg)
      .expect(200)
      .end(async (_, res) => {
        const { xml: reply } = await parseXML(res.body.toString())
        const encrypted = reply.encrypt
        const { xml: data } = await parseXML(cryptor.decrypt(encrypted))
        expect(data.msgType).toEqual('text')
        expect(data.content).toEqual('hehe')
        primaryServer.close(() => {
          secondaryServer.close(() => {
            server.close()
            done()
          })
        })
      })
  })
})
