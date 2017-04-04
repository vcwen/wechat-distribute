import  url = require('url')
import http = require('http')
import * as async from 'async'
import * as createDebug from 'debug'
import * as express from 'express'
import * as _ from 'lodash'
import * as request from 'request'
import Client from '../model/Client'
import Message from '../model/Message'
import ClientRouter from './ClientRouter'
import Constants from './constants'

const debug = createDebug('wechat-router')
const logError = createDebug('wechat-router:error')

class Dispatcher {
  private clientRouter: ClientRouter
  constructor(clientRouter: ClientRouter) {
    this.clientRouter = clientRouter
  }
  public dispatch(req: any, res: any, next: (err?: any) => void) {
    const message = new Message(req.weixin)
    this.clientRouter.getClients(message).then(([primaryClient, secondaryClients]) => {
      if (_.isEmpty(primaryClient) && _.isEmpty(secondaryClients)) {
        next()
      } else {
        this.dispatchPrimary(primaryClient, req.rawBody, req, res)
        this.dispatchSecondary(secondaryClients, req, res)
      }
    }).catch((e) => {
      next(e)
    })
  }
  private dispatchPrimary(client: Client, body, req, res) {
    this.makeRequest(req, res, client, (response) => {
      if (response.statusCode === 200) {
          response.pipe(res)
        }
    }, (err) => {
      logError('Primary Response Error: %o', err)
      res.sendStatus(500)
    }, Constants.PRIMARY_TIMEOUT)
  }
  private dispatchSecondary(clients: Client[], req, res) {
    async.eachOf(clients, (client, index, cb) => {
      this.makeRequest(req, res, client, (response) => {
          // Ingore secondary response
      }, (err) => {
        logError('Secondary Response Error: %o', err)
      }, Constants.SECONDARY_TIMEOUT)
    })

  }
  private makeRequest(req: any, res: any, client: Client,
    responseHandler: (res: http.IncomingMessage & express.Response) => void,
    errorHandler: (err: {code: string}) => void, timeout: number): void {
    const parsedUrl = url.parse(req.originalUrl)
    const body = req.rawBody
    const options: any = {
      url: url.resolve(client.url, parsedUrl.search),
      body,
      headers: {
        'Content-Type': 'text/xml',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout,
    }
    request.post(options, (err, response, content) => {
      let error = null
      if (err) {
        error = err
      } else if (response.statusCode !== 200) {
        error = {statusCode: response.statusCode, body: content}
      }
      if (error) {
        Reflect.apply(errorHandler, undefined, [error])
      }
    })
      .on('response', responseHandler)
  }
}

export default Dispatcher
