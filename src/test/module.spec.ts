import * as Promise from 'bluebird'
import * as chai from 'chai'
import * as ejs from 'ejs'
import * as http from 'http'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as qs from 'querystring'
import * as getRawBody from 'raw-body'
import * as superttset from 'supertest'
import * as util from 'util'
import * as mock from 'wechat-message-mock'
import {MessageHelper, WechatMessage} from 'wechat-message-mock'
import {MessageRouter, SimpleDataSource, WechatAccount} from '../main'
const expect = chai.expect
const app = new Koa()
const appPrimary = new Koa()
const appSecondary = new Koa()
const tpl = [
  '<xml>',
    '<ToUserName><![CDATA[<%=sp%>]]></ToUserName>',
    '<FromUserName><![CDATA[<%=user%>]]></FromUserName>',
    '<CreateTime>1499268163495</CreateTime>',
    '<MsgType><![CDATA[<%=type%>]]></MsgType>',
    '<% if (type === "text") { %>',
      '<Content><![CDATA[<%=text%>]]></Content>',
    '<% } else if (type === "location") { %>',
      '<Location_X><%=xPos%></Location_X>',
      '<Location_Y><%=yPos%></Location_Y>',
      '<Scale><%=scale%></Scale>',
      '<Label><![CDATA[<%=label%>]]></Label>',
    '<% } else if (type === "image") { %>',
      '<PicUrl><![CDATA[<%=pic%>]]></PicUrl>',
    '<% } else if (type === "voice") { %>',
      '<MediaId><%=mediaId%></MediaId>',
      '<Format><%=format%></Format>',
    '<% } else if (type === "link") { %>',
      '<Title><![CDATA[<%=title%>]]></Title>',
      '<Description><![CDATA[<%=description%>]]></Description>',
      '<Url><![CDATA[<%=url%>]]></Url>',
    '<% } else if (type === "event") { %>',
      '<Event><![CDATA[<%=event%>]]></Event>',
    '<% if (event === "LOCATION") { %>',
      '<Latitude><%=latitude%></Latitude>',
      '<Longitude><%=longitude%></Longitude>',
      '<Precision><%=precision%></Precision>',
    '<% } %>',
    '<% if (event === "location_select") { %>',
      '<EventKey><![CDATA[6]]></EventKey>',
      '<SendLocationInfo>',
        '<Location_X><![CDATA[<%=xPos%>]]></Location_X>',
        '<Location_Y><![CDATA[<%=yPos%>]]></Location_Y>',
        '<Scale><![CDATA[16]]></Scale>',
        '<Label><![CDATA[<%=label%>]]></Label>',
        '<Poiname><![CDATA[]]></Poiname>',
        '<EventKey><![CDATA[<%=eventKey%>]]></EventKey>',
      '</SendLocationInfo>',
    '<% } %>',
    '<% if (event === "pic_weixin") { %>',
      '<EventKey><![CDATA[someKey]]></EventKey>',
      '<SendPicsInfo>',
        '<Count>1</Count>',
        '<PicList>',
          '<item>',
            '<PicMd5Sum><![CDATA[pic_md5]]></PicMd5Sum> ',
          '</item>',
        '</PicList>',
        '<EventKey><![CDATA[<%=eventKey%>]]></EventKey>',
      '</SendPicsInfo>',
    '<% } %>',
    '<% } %>',
    '<% if (user === "web") { %>',
      'webwx_msg_cli_ver_0x1',
    '<% } %>',
  '</xml>',
].join('')

const router = new Router()
const account = new WechatAccount('test', 'appId', 'appSecret', 'REmXC07Twr6ssl9tCt4KJJTiTzqZyC1cHRltLmntZbe', 'token')
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
    url: 'http://localhost:5000/click',
  },
  click: {
    url: 'http://localhost:4000/click',
  },
}
const datasource = new SimpleDataSource(routesObj, clientsObj)
const messageRouter = new MessageRouter(account, datasource)
router.all('/wechat', messageRouter.middlewarify())

app.use(router.routes()).use(router.allowedMethods())
const wxMsg = new WechatMessage('event', 'CLICK', {eventKey: 'event_key_123'})
const request = superttset(app.listen())

describe('wechat-distributor', () => {
  it('should be able to distibute message to primary client.', (done) => {
    const timestamp = Math.floor(Date.now() / 1000)
    const expectedXml = `<xml>
<ToUserName><![CDATA[jay]]></ToUserName>
<FromUserName><![CDATA[vincent]]></FromUserName>
<CreateTime>${timestamp}</CreateTime>
<MsgType><![CDATA[event]]></MsgType>
<Event><![CDATA[CLICK]]></Event>
<EventKey><![CDATA[event_key_123]]></EventKey>\n</xml>`
    appPrimary.use(async (ctx) => {
      const xml: string = await getRawBody(ctx.req, {
        length: ctx.length,
        limit: '1mb',
        encoding: 'utf8',
      })
      expect(xml).to.equal(expectedXml)
      const info = {
        sp: 'gaofushuai',
        user: 'cs',
        type: 'text',
        text: '测试中',
      }
      const template = ejs.compile(tpl)
      ctx.body = template(info)
      ctx.status = 200
      ctx.set('Content-Type', 'application/xml')
    })
    const primaryServer: any = Promise.promisifyAll(http.createServer(appPrimary.callback()))
    primaryServer.listenAsync(4000).then(() => {

      const nonce = MessageHelper.generateNonce()
      const signature = MessageHelper.generateSignature('token', nonce, timestamp)
      request
      .post(`/wechat?` + qs.stringify({nonce, timestamp, signature}))
      .send(wxMsg.toXmlFormat('vincent', 'jay', timestamp))
      .set('Content-Type', 'application/xml')
      .expect(200)
      .end((err, res) => {
        if (err) {
          throw err
        }
        primaryServer.close()
        expect(res.text).to.equal('<xml><ToUserName><![CDATA[gaofushuai]]></ToUserName><FromUserName><![CDATA[cs]]></FromUserName><CreateTime>1499268163495</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[测试中]]></Content></xml>')
        done()
      })
    })
  })
  it('should distribute to secondary clients',  (done) => {
    const timestamp = Math.floor(Date.now() / 1000)
    appSecondary.use(async (ctx) => {
      const info = {
        sp: 'gaofushuai',
        user: 'cs',
        type: 'text',
        text: '测试中',
      }
      const xml = await getRawBody(ctx.req, {
        length: ctx.length,
        limit: '1mb',
        encoding: 'utf8',
      })
      const expectedXml = `<xml>
<ToUserName><![CDATA[jay]]></ToUserName>
<FromUserName><![CDATA[vincent]]></FromUserName>
<CreateTime>${timestamp}</CreateTime>
<MsgType><![CDATA[event]]></MsgType>
<Event><![CDATA[CLICK]]></Event>
<EventKey><![CDATA[event_key_123]]></EventKey>
</xml>`
      const template = ejs.compile(tpl)
      ctx.body = template(info)
      ctx.status = 200
      ctx.set('Content-Type', 'application/xml')
      expect(ctx.method).to.equal('POST')
      expect(ctx.headers['content-type']).to.match(/xml/)
      expect(xml).to.equal(expectedXml)
      done()

    })
    const secondaryServer: any = Promise.promisifyAll(http.createServer(appSecondary.callback()))
    secondaryServer.listenAsync(5000).then(() => {

      const nonce = MessageHelper.generateNonce()
      const signature = MessageHelper.generateSignature('token', nonce, timestamp)
      request
        .post(`/wechat?` + qs.stringify({ nonce, timestamp, signature }))
        .send(wxMsg.toXmlFormat('vincent', 'jay', timestamp))
        .set('Content-Type', 'application/xml')
        .expect(500)
        .end(() => {})
  })
  })
})
