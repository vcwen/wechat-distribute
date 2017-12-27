import * as camelCase from 'camelcase'
export class Message  {
  public toUserName: string
  public fromUserName: string
  public createTime: number
  public msgType: string
  public event?: string
  public eventKey?: string
  public rawXml: Buffer
  constructor(originalMesage: any, rawXml: Buffer) {
    this.rawXml = rawXml
    for (let key in originalMesage) {
      if (originalMesage.hasOwnProperty(key)) {
        let value = originalMesage[key]
        key = camelCase(key)
        if (key === 'event' && value) {
          value = camelCase(value)
        }
        this[key] = value
      }
    }
  }
  public getPhases() {
    if (this.event) {
      return [this.msgType, this.event as string]
    } else {
      return [this.msgType]
    }
  }
}

export default Message
