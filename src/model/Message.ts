import { List } from 'immutable'
export class Message {
  public set event(val: string | undefined) {
    this._event = val ? val.toLowerCase() : val
  }
  public get event(): string | undefined {
    return this._event
  }
  public toUserName: string
  public fromUserName: string
  public createTime: Date
  public msgType: string
  public msgId?: string
  public eventKey?: string
  public rawXml: Buffer
  private _event?: string
  constructor(fromUser: string, toUser: string, createTime: number, msgType: string, rawXml: Buffer) {
    this.rawXml = rawXml
    this.fromUserName = fromUser
    this.toUserName = toUser
    this.createTime = new Date(createTime * 1000)
    this.msgType = msgType.toLowerCase()
  }
  public getPhases() {
    if (this.event) {
      return List.of(this.msgType, this.event)
    } else {
      return List.of(this.msgType)
    }
  }
}

export default Message
