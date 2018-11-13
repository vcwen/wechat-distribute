import crypto from 'crypto'
import { parseString, processors } from 'xml2js'
export const getSignature = (timestamp, nonce, token) => {
  const shasum = crypto.createHash('sha1')
  const arr = [token, timestamp, nonce].sort()
  shasum.update(arr.join(''))
  return shasum.digest('hex')
}
export const parseXML = async (xml: string) => {
  return new Promise<any>((resolve, reject) => {
    parseString(
      xml,
      { trim: true, explicitArray: false, tagNameProcessors: [processors.firstCharLowerCase] },
      (err, obj) => {
        if (err) {
          return reject(err)
        }
        resolve(obj)
      }
    )
  })
}
