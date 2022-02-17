import crypto from 'crypto'
import { PKCS7Encoder } from './pkcs7-encoder'

const ALGORITHM = 'aes-256-cbc'

export class WechatCrypt {
  public appId: string
  public token: string
  public aesKey: Buffer
  public iv: Buffer
  constructor(appId: string, token: string, encodingAesKey: string) {
    if (encodingAesKey.length !== 43) {
      throw new TypeError('IllegalAesKey')
    }
    this.token = token
    this.appId = appId
    this.aesKey = Buffer.from(encodingAesKey + '=', 'base64')
    this.iv = this.aesKey.slice(0, 16)
  }
  public encrypt(text: string) {
    const randomString = crypto.pseudoRandomBytes(16)
    const content = Buffer.from(text)
    const networkBytesOrder = Buffer.alloc(4)
    networkBytesOrder.writeUInt32BE(content.length, 0)
    const appId = Buffer.from(this.appId)
    const dataToEncrypt = PKCS7Encoder.encode(Buffer.concat([randomString, networkBytesOrder, content, appId]))
    const cipher = crypto.createCipheriv(ALGORITHM, this.aesKey, this.iv)
    cipher.setAutoPadding(false)
    return Buffer.concat([cipher.update(dataToEncrypt), cipher.final()]).toString('base64')
  }
  public decrypt(text: string) {
    const decipher = crypto.createDecipheriv(ALGORITHM, this.aesKey, this.iv)
    decipher.setAutoPadding(false)
    const decrypted = PKCS7Encoder.decode(Buffer.concat([decipher.update(text, 'base64'), decipher.final()]))
    const length = decrypted.readUInt32BE(16)
    const appId = decrypted.slice(20 + length).toString('utf8')
    if (appId !== this.appId) {
      throw new Error(`Invalid appId:${appId}`)
    }
    return decrypted.slice(20, 20 + length).toString()
  }
  public getSignature(timestamp: string, nonce: string, ciphertext: string) {
    const shasum = crypto.createHash('sha1')
    const data = [this.token, timestamp, nonce, ciphertext].sort().join('')
    shasum.update(data)
    return shasum.digest('hex')
  }
}
