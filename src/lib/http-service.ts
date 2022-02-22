import concatStream from 'concat-stream'
import debugLog from 'debug'
import http, { IncomingMessage, ServerResponse } from 'http'
import https from 'https'
import { URL } from 'url'
import { ContentType } from './dispatcher'
import { Message } from './message'

const debug = debugLog('wechat-distriute')

export interface HttpOptions {
  url: string
  isPrimary: boolean
  request: IncomingMessage
  response?: ServerResponse
  contentType: ContentType
  auth?: { type: string; scheme: string; bearerFormat?: string }
}
export class HttpService {
  public async dispatchMessage(message: Message, options: HttpOptions) {
    const req = options.request
    const targetUrl = new URL(options.url)
    const originalUrl = new URL(req.url, `http://${req.headers.host}`)
    if (options.contentType === ContentType.ORIGINAL) {
      this.passthrough(message, options)
    } else {
      this.dispatchJsonMessage(message, options)
    }
  }
  public async passthrough(message: Message, options: HttpOptions) {
    const targetUrl = new URL(options.url)
    const req = options.request
    const res = options.response
    const originalUrl = new URL(req.url, `http://${req.headers.host}`)

    if (originalUrl.search) {
      targetUrl.search = originalUrl.search
    }
    const request = targetUrl.protocol === 'https' ? https.request : http.request
    return new Promise((resolve, reject) => {
      const forwardRequest = request(
        targetUrl,
        { method: 'POST', headers: req.headers, timeout: 5000 },
        (clientRes) => {
          if (clientRes.statusCode >= 400) {
            console.error('error')
          } else {
            console.log('passthrough')
          }
          clientRes.on('error', reject)

          // const bodyStream = concatStream((buffer) => {
          //   const body = buffer.toString()
          // })
          // clientRes.pipe(bodyStream)
          if (options.isPrimary) {
            clientRes.pipe(res).on('finish', resolve)
          }
          res.on('end', () => {
            debug(`Distribute request to ${targetUrl}`)
          })
          res.on('error', (err) => {
            debug(`Distribute to client: ${targetUrl} failed with error: ${err.message}.`)
            reject(err)
          })
        }
      )
      forwardRequest.write(message.rawData)
      forwardRequest.on('error', (err) => {
        debug(`Distribute to client: ${targetUrl} failed with error: ${err.message}.`)
        reject(err)
      })
      forwardRequest.end()
    })
  }
  public async dispatchJsonMessage(message: Message, options: HttpOptions) {
    const targetUrl = new URL(options.url)
    const req = options.request
    const res = options.response
    const originalUrl = new URL(req.url, `http://${req.headers.host}`)

    if (originalUrl.search) {
      targetUrl.search = originalUrl.search
      // const props = Object.getOwnPropertyNames(options.query)
      // props.forEach((prop) => {
      //   targetUrl.searchParams.append(prop, options.query[prop])
      // })
    }
    const request = targetUrl.protocol === 'https' ? https.request : http.request
    return new Promise<void>((resolve, reject) => {
      const forwardRequest = request(
        targetUrl,
        { method: 'POST', headers: { host: req.headers.host, 'content-type': 'application/json' }, timeout: 5000 },
        (clientRes) => {
          if (clientRes.statusCode >= 400) {
            const bodyStream = concatStream((buffer) => {
              const body = buffer.toString()
              reject(body)
            })
            clientRes.pipe(bodyStream)
          } else {
            resolve()
          }
          clientRes.on('error', (err) => {
            debug(`Distribute to client: ${targetUrl} failed with error: ${err.message}.`)
            reject(err)
          })
          if (options.isPrimary) {
            clientRes.pipe(res).on('finish', resolve)
          }
        }
      )
      forwardRequest.write(message.data)
      forwardRequest.on('error', (err) => {
        debug(`Distribute to client: ${targetUrl} failed with error: ${err.message}.`)
        reject(err)
      })
      forwardRequest.end()
    })
  }
}
