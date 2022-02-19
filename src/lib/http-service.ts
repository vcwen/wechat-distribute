import concatStream from 'concat-stream'
import debugLog from 'debug'
import http, { IncomingMessage, ServerResponse } from 'http'
import https from 'https'
import { URL } from 'url'
import { Message } from './message'

const debug = debugLog('wechat-distriute')

export class HttpService {
  public async pipeMessage(url: string, message: Message, req: IncomingMessage, res: ServerResponse) {
    const targetUrl = new URL(url)
    const originalUrl = new URL(req.url, `http://${req.headers.host}`)

    if (originalUrl.search) {
      targetUrl.search = originalUrl.search
      // const props = Object.getOwnPropertyNames(options.query)
      // props.forEach((prop) => {
      //   targetUrl.searchParams.append(prop, options.query[prop])
      // })
    }
    const request = targetUrl.protocol === 'https' ? https.request : http.request
    return new Promise((resolve, reject) => {
      const forwardRequest = request(
        targetUrl,
        { method: 'POST', headers: req.headers, timeout: 5000 },
        (clientRes) => {
          clientRes.pipe(res).on('error', reject).on('finish', resolve)
          res.on('end', () => {
            debug(`Distribute request to ${url}`)
          })
          res.on('error', (err) => {
            debug(`Distribute to client: ${url} failed with error: ${err.message}.`)
            reject(err)
          })
        }
      )
      forwardRequest.write(message.rawData)
      forwardRequest.on('error', (err) => {
        debug(`Distribute to client: ${url} failed with error: ${err.message}.`)
        reject(err)
      })
      forwardRequest.end()
    })
  }
  public async dispatchMessage(url: string, message: Message, req: IncomingMessage) {
    const targetUrl = new URL(url)
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
        { method: 'POST', headers: req.headers, timeout: 5000 },
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
            debug(`Distribute to client: ${url} failed with error: ${err.message}.`)
            reject(err)
          })
        }
      )
      forwardRequest.write(message.rawData)
      forwardRequest.on('error', (err) => {
        debug(`Distribute to client: ${url} failed with error: ${err.message}.`)
        reject(err)
      })
      forwardRequest.end()
    })
  }
}
