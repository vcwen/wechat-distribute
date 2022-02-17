import crypto from 'crypto'
export const generateSignature = (timestamp, nonce, token) => {
  const shasum = crypto.createHash('sha1')
  const arr = [token, timestamp, nonce].sort()
  shasum.update(arr.join(''))
  return shasum.digest('hex')
}
