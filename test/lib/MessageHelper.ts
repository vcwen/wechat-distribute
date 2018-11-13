import * as crypto from 'crypto'
import * as ejs from 'ejs'

const encryptedTpl = '<xml><Encrypt><![CDATA[<%-encrypt%>]]></Encrypt></xml>'
const compiledTpl = ejs.compile(encryptedTpl, {})

export default class MessageHelper {
  public static generateSignature(token, nonce, timestamp) {
    const shasum = crypto.createHash('sha1')
    const arr = [token, timestamp, nonce].sort()
    shasum.update(arr.join(''))
    const signature = shasum.digest('hex')
    return signature
  }

  public static generateNonce() {
    const regex = /[1-9]\d{9}/
    const match = regex.exec(Math.random().toString())
    if (match) {
      return match[0]
    } else {
      throw new Error('Failed to generate nonce string')
    }
  }
  public static getTimestamp() {
    return Math.floor(Date.now() / 1000)
  }
  public static encryptMessage(encryptMessage: string) {
    const encryptXml = compiledTpl({
      encrypt: encryptMessage
    })
    return encryptXml
  }
}
