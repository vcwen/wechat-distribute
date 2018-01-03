import * as crypto from 'crypto'
import * as Koa from 'koa'
import * as getRawBody from 'raw-body'
import * as xml2js from 'xml2js'
import Message from '../model/Message'
export default class Helper {
  public static async extractWechatMessage(ctx: Koa.Context, cryptor: any) {
    const query = ctx.query
    const encrypted = !!(query.encrypt_type && query.encrypt_type === 'aes' && query.msg_signature)
    const timestamp = query.timestamp
    const nonce = query.nonce

    const xml: Buffer = await getRawBody(ctx.req, {
      length: ctx.length,
      limit: '1mb'
    })
    const result = await parseXML(xml)
    let formatted = formatMessage(result.xml)
    if (encrypted) {
      const encryptMessage = formatted.Encrypt
      if (query.msg_signature !== cryptor.getSignature(timestamp, nonce, encryptMessage)) {
        ctx.throw(401, 'Invalid signature')
      }
      const decryptedXML = cryptor.decrypt(encryptMessage)
      const messageWrapXml = decryptedXML.message
      if (messageWrapXml === '') {
        ctx.throw(401, 'Invalid signature')
      }
      const decodedXML = await parseXML(messageWrapXml)
      formatted = formatMessage(decodedXML.xml)
    }
    return new Message(formatted, xml)
  }
  public static getSignature(timestamp, nonce, token) {
    const shasum = crypto.createHash('sha1')
    const arr = [token, timestamp, nonce].sort()
    shasum.update(arr.join(''))
    return shasum.digest('hex')
  }
  public static async parseMessageXml(xml: string) {
    return formatMessage((await parseXML(xml)).xml)
  }
}

function parseXML(xml): any {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, { trim: true }, (err, obj) => {
      if (err) {
        return reject(err)
      }
      resolve(obj)
    })
  })
}

function formatMessage(result): any {
  const message = {}
  if (typeof result === 'object') {
    for (const key in result) {
      if (!(result[key] instanceof Array) || result[key].length === 0) {
        continue
      }
      if (result[key].length === 1) {
        const val = result[key][0]
        if (typeof val === 'object') {
          message[key] = formatMessage(val)
        } else {
          message[key] = (val || '').trim()
        }
      } else {
        message[key] = result[key].map((item) => {
          return formatMessage(item)
        })
      }
    }
  }
  return message
}

export function extractAppId(url: string) {
  const appIdRegex = /.*\/(\w+)(\??.*)$/
  const match = appIdRegex.exec(url)
  if (match) {
    return match[1]
  } else {
    return undefined
  }
}
