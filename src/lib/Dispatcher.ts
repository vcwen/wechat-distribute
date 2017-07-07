import  url = require('url')
import http = require('http')
import * as createDebug from 'debug'
import * as Koa from 'koa'
import * as _ from 'lodash'

import * as request from 'request'
import {PassThrough} from 'stream'
import Client from '../model/Client'
import Message from '../model/Message'
import WechatAccount from '../model/WechatAccount'
import ClientRouter from './ClientRouter'
import Constants from './constants'

const debug = createDebug('wechat-distribute')

class Dispatcher {
  private clientRouter: ClientRouter
  constructor(clientRouter: ClientRouter) {
    this.clientRouter = clientRouter
  }
  public async dispatch(ctx: Koa.Context, message: Message) {
    const [primaryClient, secondaryClients] = await this.clientRouter.getClients(message)
    this.dispatchSecondary(ctx, secondaryClients, message)
    if (_.isEmpty(primaryClient)) {
      ctx.status = 404
    } else {
      await this.dispatchPrimary(ctx, primaryClient, message)
    }

  }
  private async dispatchPrimary(ctx: Koa.Context, client: Client, message: Message) {
    await this.makeRequest(ctx, client, message, true, Constants.PRIMARY_TIMEOUT)
  }
  private dispatchSecondary(ctx: Koa.Context, clients: Client[], message: Message) {
    clients.forEach((client) => {
      this.makeRequest(ctx, client, message, false, Constants.SECONDARY_TIMEOUT)
    })

  }
  private async makeRequest(ctx: Koa.Context, client: Client, message: Message, isPrimary: boolean, timeout: number) {
    const response = request.post({
      url: url.resolve(client.url, ctx.search),
      body: message.rawXml,
      headers: {
        'Content-Type': 'text/xml',
        'Content-Length': message.rawXml.length,
      }, timeout})
    const responseHandler = (res: http.IncomingMessage) => {
      if (res.statusCode === 200) {
        debug(`Request to ${client.url} succeeded.`)
      } else {
         debug(`Request to ${client.url} failed with status ${res.statusCode}.` )
      }
    }
    const errorHandler = (err) => {
      debug(`Request to ${client.url} failed with error ${err}.`)
    }
    response.on('response', responseHandler)
    response.on('error', errorHandler)
    if (isPrimary) {
      await new Promise((resolve, reject) => {
        ctx.set('Content-Type', 'text/xml')
        response.on('error', ctx.onerror.bind(ctx))
        response.on('response', (res) => {
          ctx.status = res.statusCode
          ctx.set('Content-Type', res.headers['content-type'] ? res.headers['content-type'] : 'text/xml')
          resolve()
        })
        ctx.body = response.pipe(new PassThrough())
      })
    }
  }
}

export default Dispatcher
