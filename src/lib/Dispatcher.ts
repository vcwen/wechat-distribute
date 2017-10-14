import axios from 'axios'
import * as Koa from 'koa'
import * as url from 'url'
import * as logger from 'winston'
import Client from '../model/Client'
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
    this.dispatchSecondary(ctx, secondaryClients, message)
    if (!primaryClient) {
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
        ctx.set('Content-Type', 'text/xml')
        ctx.body = response.data
      }
      logger.info(`Distribute request to ${client.url}`)
    } catch (err) {
      logger.error(`Distribute to ${client.url} failed with error: ${err.message}.`)
      if (isPrimary) {
        ctx.status = 500
      }
    }
  }
}

export default Dispatcher
