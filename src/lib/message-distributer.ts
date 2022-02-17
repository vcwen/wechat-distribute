import concat from 'concat-stream'
import { IncomingMessage, ServerResponse } from 'http'
// import getRawBody from 'raw-body'
import { Message } from './message'
import { WechatAccount } from './wechat-account'
import { generateSignature } from './utils'
import { XMLParser } from 'fast-xml-parser'
import fs from 'fs'
import Path from 'path'

import yaml from 'js-yaml'
import { ConfigRoute, MessageRouter } from './message-router'
import { Dispatcher, HttpDispatcher, RedisDispatcher } from './dispatcher'

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

type AccountConfig = {
  name: string
  appId: string
  token: string
  encryptionKey: string
  dispatchers: {
    name: string
    type: 'http' | 'redis'
    spec: {
      url: string
      host: string
      port: number
      db: number
      password: string
      stream: string
      maxLen: number
    }
  }[]
  router: ConfigRoute
}

export class MessageDistributer {
  private wechatAccounts: Map<string, WechatAccount> = new Map()
  public loadConfig(dirPath: string) {
    const filenames = fs.readdirSync(dirPath)
    filenames.forEach((filename) => {
      const filepath = Path.resolve(dirPath, filename)
      const config = yaml.load(fs.readFileSync(filepath, 'utf8')) as AccountConfig
      const dispatcherList = config.dispatchers
      const dispatchers = new Map<string, Dispatcher>()
      dispatcherList.forEach((dispatcherInfo) => {
        switch (dispatcherInfo.type) {
          case 'http':
            dispatchers.set(dispatcherInfo.name, new HttpDispatcher(dispatcherInfo.name, dispatcherInfo.spec.url))
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

        if (msg_signature !== wechatAccount.crypt.getSignature(timestamp, nonce, rawMessage.encrypt)) {
          res.statusCode = 401
          return res.end('Invalid signature')
        }
        const xml = wechatAccount.crypt.decrypt(rawMessage.encrypt)
        rawMessage = xmlParser.parse(xml)
      }
      console.log(rawMessage)
      const msg = new Message(rawMessage, rawBody)

      await wechatAccount.distributeMessage(req, res, msg)
    }
  }
}
