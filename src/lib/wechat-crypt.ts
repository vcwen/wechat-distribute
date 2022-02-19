import crypto from 'crypto'
import { PKCS7Encoder } from './pkcs7-encoder'

const ALGORITHM = 'aes-256-cbc'

export class WechatCrypto {
  public static encrypt(text: string, appId: string, encryptionKey: string) {
    const iv = this.getInitialVector(encryptionKey)
    const randomString = crypto.pseudoRandomBytes(16)
    const content = Buffer.from(text)
    const networkBytesOrder = Buffer.alloc(4)
    networkBytesOrder.writeUInt32BE(content.length, 0)
    const dataToEncrypt = PKCS7Encoder.encode(
      Buffer.concat([randomString, networkBytesOrder, content, Buffer.from(appId)])
    )
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv)
    cipher.setAutoPadding(false)
    return Buffer.concat([cipher.update(dataToEncrypt), cipher.final()]).toString('base64')
  }

  public static decrypt(text: string, appId: string, encryptionKey: string) {
    const iv = this.getInitialVector(encryptionKey)
    const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv)
    decipher.setAutoPadding(false)
    const decrypted = PKCS7Encoder.decode(Buffer.concat([decipher.update(text, 'base64'), decipher.final()]))
    const length = decrypted.readUInt32BE(16)
    const decryptedAppId = decrypted.slice(20 + length).toString('utf8')
    if (appId !== decryptedAppId) {
      throw new Error(`Invalid appId:${decryptedAppId}`)
    }
    return decrypted.slice(20, 20 + length).toString()
  }

  public static getSignature(token: string, timestamp: string, nonce: string, ciphertext: string) {
    const shasum = crypto.createHash('sha1')
    const data = [token, timestamp, nonce, ciphertext].sort().join('')
    shasum.update(data)
    return shasum.digest('hex')
  }

  private static getInitialVector(encryptionKey: string): Buffer {
    const buffer = Buffer.from(encryptionKey + '=', 'base64')
    return buffer.slice(0, 16)
  }
}
