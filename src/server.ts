import http from 'http'
import { match } from 'path-to-regexp'
import config from './config'
import { MessageDistributer } from './lib/message-distributer'

const distributer = new MessageDistributer()
distributer.loadConfig(config.configDir)

const server = http.createServer((req, res) => {
  if (!['GET', 'POST'].includes(req.method)) {
    res.statusCode = 501
    res.end('Not Implemented')
  }
  const matchPath = match<{ appId: string }>(config.publicPath)
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

server.listen(config.port)
