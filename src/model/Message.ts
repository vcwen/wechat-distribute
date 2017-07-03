import * as camelCase from 'camelcase'
class Message  {
  public toUserName: string
  public fromUserName: string
  public createTime: number
  public msgType: string
  public event?: string
  public eventKey?: string
  constructor(originalMesage: any) {
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
}

export default Message
