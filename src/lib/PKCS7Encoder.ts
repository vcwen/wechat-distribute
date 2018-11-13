export class PKCS7Encoder {
  public static encode(buffer: Buffer) {
    const BLOCK_SIZE = 32
    const count = buffer.length
    let amountToPad = BLOCK_SIZE - (count % BLOCK_SIZE)
    if (amountToPad === 0) {
      amountToPad = BLOCK_SIZE
    }
    const pads = Buffer.alloc(amountToPad)
    pads.fill(amountToPad)
    return Buffer.concat([buffer, pads])
  }
  public static decode(decrypted: Buffer) {
    let pad = decrypted[decrypted.length - 1]
    if (pad < 1 || pad > 32) {
      pad = 0
    }
    return decrypted.slice(0, decrypted.length - pad)
  }
}
