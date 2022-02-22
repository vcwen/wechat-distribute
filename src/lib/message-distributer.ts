import concat from 'concat-stream'
import { XMLParser } from 'fast-xml-parser'
import fs from 'fs'
import { IncomingMessage, ServerResponse } from 'http'
import Path from 'path'
import { Message } from './message'
import { generateSignature } from './utils'
import { WechatAccount } from './wechat-account'

import yaml from 'js-yaml'
import { ContentType, Dispatcher, HttpDispatcher, RedisDispatcher } from './dispatcher'
import { IConfigRoute, MessageRouter } from './message-router'
import { URL } from 'url'

const getRawBody = (req: IncomingMessage) => {
  return new Promise<Buffer>((resolve, reject) => {
    const bodyStream = concat((data) => {
      resolve(data)
    })
    req.on('error', reject)
    req.pipe(bodyStream)
  })
}

const xmlParser = new XMLParser()

interface IAccountConfig {
  name: string
  appId: string
  token: string
  encryptionKey: string
  dispatchers: Array<{
    name: string
    type: 'http' | 'redis'
    spec: {
      url: string
      contentType: ContentType
      auth: {
        type: string
        scheme: string
        bearerFormat?: string
      }
      host: string
      port: number
      db: number
      password: string
      stream: string
      maxLen: number
    }
  }>
  router: IConfigRoute
}

export class MessageDistributer {
  private wechatAccounts: Map<string, WechatAccount> = new Map()
  public loadConfig(dirPath: string) {
    const filenames = fs.readdirSync(dirPath)
    filenames.forEach((filename) => {
      if (!(filename.endsWith('.yaml') || filename.endsWith('.yml'))) {
        return
      }
      const filepath = Path.resolve(dirPath, filename)
      const config = yaml.load(fs.readFileSync(filepath, 'utf8')) as IAccountConfig
      const dispatcherList = config.dispatchers
      const dispatchers = new Map<string, Dispatcher>()
      dispatcherList.forEach((dispatcherInfo) => {
        switch (dispatcherInfo.type) {
          case 'http':
            dispatchers.set(
              dispatcherInfo.name,
              new HttpDispatcher(dispatcherInfo.name, dispatcherInfo.spec.url, dispatcherInfo.spec.contentType)
            )
            break
          case 'redis':
            dispatchers.set(
              dispatcherInfo.name,
              new RedisDispatcher(dispatcherInfo.name, {
                host: dispatcherInfo.spec.host,
                port: dispatcherInfo.spec.port,
                db: dispatcherInfo.spec.db,
                password: dispatcherInfo.spec.password,
                stream: dispatcherInfo.spec.stream,
                maxLen: dispatcherInfo.spec.maxLen
              })
            )
            break
          default:
            throw new Error(`unknown dispatcher type:${dispatcherInfo.type}`)
        }
      })

      const routerInfo = config.router
      const messageRouter = new MessageRouter(config.appId, routerInfo, dispatchers)
      const wechatAccount = new WechatAccount(
        config.name,
        config.appId,
        config.encryptionKey,
        config.token,
        messageRouter,
        dispatchers
      )
      this.wechatAccounts.set(wechatAccount.appId, wechatAccount)
    })
    console.log(this.wechatAccounts)
  }

  public async distribute(appId: string, req: IncomingMessage, res: ServerResponse) {
    const wechatAccount = this.wechatAccounts.get(appId)
    if (!wechatAccount) {
      res.statusCode = 400
      return res.end('Invalid appId')
    }

    const reqUrl = new URL(req.url, `http://${req.headers.host}`)
    const encrypted = reqUrl.searchParams.get('encrypt_type') === 'aes'
    if (!encrypted) {
      const signature = reqUrl.searchParams.get('signature')
      const timestamp = reqUrl.searchParams.get('timestamp')
      const nonce = reqUrl.searchParams.get('nonce')
      if (signature !== generateSignature(timestamp, nonce, wechatAccount.token)) {
        res.statusCode = 401
        return res.end('Invalid signature')
      }
    }

    if (req.method === 'GET') {
      const echostr = reqUrl.searchParams.get('echostr')
      res.end(echostr)
    } else if (req.method === 'POST') {
      const rawBody = await getRawBody(req)
      let { xml: rawMessage } = xmlParser.parse(rawBody)
      if (encrypted) {
        const msg_signature = reqUrl.searchParams.get('signature')
        const timestamp = reqUrl.searchParams.get('timestamp')
        const nonce = reqUrl.searchParams.get('nonce')

        if (msg_signature !== wechatAccount.getSignature(timestamp, nonce, rawMessage.encrypt)) {
          res.statusCode = 401
          return res.end('Invalid signature')
        }
        const xml = wechatAccount.decrypt(rawMessage.Encrypt)
        rawMessage = xmlParser.parse(xml)
      }
      console.log(rawMessage)
      const msg = new Message(rawMessage, rawBody)

      await wechatAccount.distributeMessage(req, res, msg)
    }
  }
}
