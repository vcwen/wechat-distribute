import debug from 'debug'
import { request } from 'http'
import { Map, Set } from 'immutable'
import { Context } from 'koa'
import { PassThrough } from 'stream'
import { URL } from 'url'
import { IDataSource } from '../main'
import Message from '../model/Message'
import ClientRouter from './ClientRouter'
import Constants from './Constants'

const log = debug('wechat-distribute')

interface IRequestOptions {
  query: any
  headers: any
  timeout: number
}
class Dispatcher {
  private _datasource: IDataSource
  private _clientRouters: Map<string, ClientRouter> = Map()
  constructor(datasource: IDataSource) {
    this._datasource = datasource
  }
  public async dispatch(ctx: Context, message: Message) {
    let clientRouter = this._clientRouters.get(message.toUserName)
    if (!clientRouter) {
      clientRouter = new ClientRouter(this._datasource.getClientsByWechatId(message.toUserName))
      this._clientRouters = this._clientRouters.set(message.toUserName, clientRouter)
    }
    const [primary, secondaries] = await clientRouter.getTargetClients(message)
    const options: IRequestOptions = {
      query: ctx.query,
      headers: ctx.headers,
      timeout: Constants.PRIMARY_TIMEOUT
    }
    this._dispatchSecondary(message, secondaries, Object.assign(options, { timeout: Constants.SECONDARY_TIMEOUT }))
    if (primary) {
      ctx.body = await this._dispatchPrimary(message, primary, options)
    } else {
      ctx.status = 200
      ctx.body = ''
    }
  }
  private async _dispatchPrimary(message: Message, url: string, options: IRequestOptions) {
    return this._makeRequest(url, message, options)
  }
  private _dispatchSecondary(message: Message, urls: Set<string>, options: IRequestOptions) {
    urls.forEach((url) => {
      this._makeRequest(url, message, options)
    })
  }
  private async _makeRequest(url: string, message: Message, options: IRequestOptions) {
    const targetUrl = new URL(url)
    if (options.query) {
      const props = Object.getOwnPropertyNames(options.query)
      props.forEach((prop) => {
        targetUrl.searchParams.append(prop, options.query[prop])
      })
    }
    return new Promise((resolve, reject) => {
      const headers = Object.assign({ 'Content-Type': 'text/xml' }, options.headers)
      const opts = {
        protocol: targetUrl.protocol,
        hostname: targetUrl.hostname,

        port: targetUrl.port,
        path: targetUrl.pathname + targetUrl.search
      }
      const req = request(Object.assign(opts, { method: 'POST', headers, timeout: options.timeout }), (res) => {
        res.on('end', () => {
          log(`Distribute request to ${url}`)
        })
        res.on('error', (err) => {
          log(`Distribute to client: ${url} failed with error: ${err.message}.`)
          reject(err)
        })
        resolve(res.pipe(new PassThrough()))
      })
      req.write(message.rawXml)
      req.on('error', (err) => {
        log(`Distribute to client: ${url} failed with error: ${err.message}.`)
        reject(err)
      })
      req.end()
    })
  }
}

export default Dispatcher
