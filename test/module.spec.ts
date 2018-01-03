import * as  wechat from 'co-wechat'
import * as ejs from 'ejs'
import * as http from 'http'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as qs from 'querystring'
import * as getRawBody from 'raw-body'
import * as superttset from 'supertest'
import {MessageHelper, WechatMessage} from 'wechat-message-mock'
import Helper from '../src/lib/Helper'
import {MessageRouter, SimpleDataSource, WechatAccount} from '../src/main'

const config = {
  token: 'token',
  appid: 'appId',
  encodingAESKey: '4nrPbcFEKJE8AH3b2chrqbmf7txGi8S0mmBSbycnTee'
}
const app = new Koa()
const appPrimary = new Koa()
const appSecondary = new Koa()
let primaryServer: http.Server
let secondaryServer: http.Server

const router = new Router()
const account = new WechatAccount('jay', 'test', 'appId', 'appSecret',
  '4nrPbcFEKJE8AH3b2chrqbmf7txGi8S0mmBSbycnTee', 'token')
const accounts = {
  test: {
    appId: 'appId',
    name: 'account_name',
    id: 'jay',
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
          click: 'secondary'
        }
      },
      click: {
        url: 'http://localhost:4000/click',
        interests: {
          click: 'primary'
        }
      }
    }
  }
}

const datasource = new SimpleDataSource(accounts)
const messageRouter = new MessageRouter(datasource)
router.all('/wechat/:appId', messageRouter.middlewarify())

app.use(router.routes()).use(router.allowedMethods())
const timestamp = Math.floor(Date.now() / 1000)
const wxMsg = new WechatMessage('event',
  {eventKey: 'event_key_123', toUserName: 'jay', fromUserName: 'vincent', timestamp}, 'CLICK')
const server = app.listen()
const request = superttset(server)

const stacks = [] as any[]

describe('wechat-distributor', () => {
  beforeAll(() => {
    appPrimary.use(wechat(config).middleware(async (message, ctx) => {
      return 'hehe'
    }))
    primaryServer = appPrimary.listen(4000)
    appSecondary.use(wechat(config).middleware(async (message, ctx) => {
      for ( const mid of stacks) {
        return mid.call(null, message, ctx)
      }
    }))
    secondaryServer = appSecondary.listen(5000)
  })
  afterAll(() => {
    primaryServer.close()
    secondaryServer.close()
    server.close()
  })
  it('should be able to distibute message to primary client.',  (done) => {
    const nonce = MessageHelper.generateNonce()
    const signature = MessageHelper.generateSignature('token', nonce, timestamp)
    request
      .post(`/wechat/appId?` + qs.stringify({nonce, timestamp, signature}))
      .set('Content-Type', 'application/xml')
      .send(wxMsg.toXmlFormat())
      .expect(200)
      .end(async (_, res) => {
        // expect(res.statusCode).toBe(200)
        const reply = await Helper.parseMessageXml(res.text)
        expect(reply.MsgType).toEqual('text')
        expect(reply.Content).toEqual('hehe')
        done()
      })
  })
  it('should distribute to secondary clients',  (done) => {
    const nonce = MessageHelper.generateNonce()
    const signature = MessageHelper.generateSignature('token', nonce, timestamp)
    stacks.push((message) => {
      expect(message.MsgType).toBe('event')
      expect(message.Event).toBe('CLICK')
      expect(message.EventKey).toBe('event_key_123')
      done()
    })
    request
      .post(`/wechat/appId?` + qs.stringify({ nonce, timestamp, signature }))
      .set('Content-Type', 'application/xml')
      .send(wxMsg.toXmlFormat())
      .expect(200)
  .end(() => {/* emptry */})
  })
})
