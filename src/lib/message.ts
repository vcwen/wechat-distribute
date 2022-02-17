export class Message {
  public toUserName: string
  public fromUserName: string
  public createTime: Date
  public msgType: string
  public msgId?: string
  public eventKey?: string
  public rawData: Buffer
  public event?: string
  public data: Record<string, any>
  constructor(data: Record<string, any>, rawData: Buffer) {
    this.data = data
    this.rawData = rawData
    this.fromUserName = data.FromUser
    this.toUserName = data.ToUser
    this.createTime = new Date(Number(data.CreateTime) * 1000)
    this.msgType = data.MsgType.toLowerCase()
    if (data.MsgType === 'event') {
      this.event = data.Event.toLowerCase()
      this.eventKey = data.EventKey
    }
  }
  public getTopic(): string {
    if (this.event) {
      return [this.msgType, this.event].join('.')
    } else {
      return this.msgType
    }
  }
}
