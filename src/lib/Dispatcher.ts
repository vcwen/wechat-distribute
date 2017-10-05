import axios from 'axios'
import * as createDebug from 'debug'
import * as http from 'http'
import * as Koa from 'koa'
import * as _ from 'lodash'
import {PassThrough} from 'stream'
import * as url from 'url'
import * as logger from 'winston'
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
    try {
      const response = await axios.post(url.resolve(client.url, ctx.search), message.rawXml, {
        headers: {
          'Content-Type': 'text/xml',
          'Content-Length': message.rawXml.length
        },
        responseType: 'stream',
        timeout
      })
      if (isPrimary) {
        ctx.status = response.status
        ctx.set('Content-Type', response.headers['content-type'] ? response.headers['content-type'] : 'text/xml')
        ctx.body = response.data
      }
      logger.info(`Distribute request to ${client.url}`)
    } catch (err) {
      logger.error(`Distribute to ${client.url} failed with error: ${err.message}.`)
      ctx.status = 500
    }
  }
}

export default Dispatcher
