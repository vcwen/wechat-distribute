import axios from 'axios'
import {Set} from 'immutable'
import * as Koa from 'koa'
import * as Url from 'url'
import * as logger from 'winston'
import Message from '../model/Message'
import ClientRouter from './ClientRouter'
import Constants from './Constants'

class Dispatcher {
  private clientRouter: ClientRouter
  constructor(clientRouter: ClientRouter) {
    this.clientRouter = clientRouter
  }
  public async dispatch(ctx: Koa.Context, message: Message) {
    const [primaryClient, secondaryClients] = await this.clientRouter.getClients(message)
    await this.dispatchPrimary(ctx, primaryClient, message)
    this.dispatchSecondary(ctx, secondaryClients, message)

  }
  private async dispatchPrimary(ctx: Koa.Context, url: string, message: Message) {
    await this.makeRequest(ctx, url, message, true, Constants.PRIMARY_TIMEOUT)
  }
  private dispatchSecondary(ctx: Koa.Context, urls: Set<string>, message: Message) {
    urls.forEach((url) => {
      this.makeRequest(ctx, url, message, false, Constants.SECONDARY_TIMEOUT)
    })

  }
  private async makeRequest(ctx: Koa.Context, url: string, message: Message, isPrimary: boolean, timeout: number) {
    try {
      const response = await axios.post(Url.resolve(url, ctx.search), message.rawXml, {
        headers: {
          'Content-Type': 'text/xml',
          'Content-Length': message.rawXml.length
        },
        responseType: 'stream',
        timeout
      })
      if (isPrimary) {
        ctx.status = response.status
        ctx.set('Content-Type', 'text/xml')
        ctx.body = response.data
      }
      logger.info(`Distribute request to ${url}`)
    } catch (err) {
      logger.error(`Distribute to ${url} failed with error: ${err.message}.`)
      if (isPrimary) {
        ctx.status = 500
      }
    }
  }
}

export default Dispatcher
