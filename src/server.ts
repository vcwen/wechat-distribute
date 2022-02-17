import { match } from 'path-to-regexp'
import http from 'http'
import { MessageDistributer } from './lib/message-distributer'

const distributer = new MessageDistributer()
distributer.loadConfig('./config')

const server = http.createServer((req, res) => {
  if (!['GET', 'POST'].includes(req.method)) {
    res.statusCode = 501
    res.end('Not Implemented')
  }
  const matchPath = match<{ appId: string }>('/apps/:appId')
  const url = new URL(req.url, `http://${req.headers.host}`)
  const matchResult = matchPath(url.pathname)
  if (matchResult) {
    const appId = matchResult.params.appId
    distributer.distribute(appId, req, res)
  } else {
    res.statusCode = 404
    res.end('Not Implemented')
  }
})

server.listen(3000)
