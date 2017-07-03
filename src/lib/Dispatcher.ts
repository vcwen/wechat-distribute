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
    if (_.isEmpty(primaryClient)) {
      ctx.status = 404
    } else {
      this.dispatchPrimary(ctx, primaryClient)
    }
    this.dispatchSecondary(ctx, secondaryClients)
  }
  private dispatchPrimary(ctx: Koa.Context, client: Client ) {
    this.makeRequest(ctx, client, true, Constants.PRIMARY_TIMEOUT)
  }
  private dispatchSecondary(ctx: Koa.Context, clients: Client[]) {
    clients.forEach((client) => {
      this.makeRequest(ctx, client, false, Constants.SECONDARY_TIMEOUT)
    })

  }
  private makeRequest(ctx: Koa.Context, client: Client, isPrimary: boolean, timeout: number): void {
    const response = ctx.req.pipe(request.post(url.resolve(client.url, ctx.search), {timeout}))
    const responseHandler = (res: http.IncomingMessage) => {
      if (res.statusCode === 200) {
        debug(`Request to ${client.url} succeeded.`)
      } else {
        debug(`Request to ${client.url} failed with status ${res.statusCode}.` )
      }
    }
    const errorHandler = (err) => {
      debug(`Request to ${client.url} failed with error ${err}.`)
      if (isPrimary) {
        ctx.onerror.apply(ctx, arguments)
      }
    }
    response.on('response', responseHandler)
    response.on('error', errorHandler)
    if (isPrimary) {
      ctx.body = response.pipe(new PassThrough())
    }
  }
}

export default Dispatcher
