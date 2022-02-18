import { IncomingMessage, ServerResponse } from 'http'
import { Message } from './message'
import Redis, { RedisOptions } from 'ioredis'
import { HttpService } from './http-service'

export abstract class Dispatcher {
  public type: string
  constructor(public name: string) {}
  public abstract dispatchPrimary(message: Message, req: IncomingMessage, res: ServerResponse)
  public abstract dispatchSecondary(message: Message, req: IncomingMessage)
}

export class HttpDispatcher extends Dispatcher {
  private httpService: HttpService = new HttpService()
  public url: string
  constructor(name: string, url: string) {
    super(name)
    this.url = url
  }
  public dispatchPrimary(message: Message, req: IncomingMessage, res: ServerResponse) {
    this.httpService.pipeMessage(this.url, message, req, res)
  }
  public dispatchSecondary(message: Message, req: IncomingMessage) {
    this.httpService.dispatchMessage(this.url, message, req)
  }
}

export interface RedisDispatcherOptions extends RedisOptions {
  stream: string
  maxLen?: number
}

export class RedisDispatcher extends Dispatcher {
  public type = 'redis'
  private redis: Redis.Redis
  private stream: string
  private maxLen: number
  constructor(name: string, options: RedisDispatcherOptions) {
    super(name)
    console.log(options)
    this.redis = new Redis(options)
    this.stream = options.stream
    this.maxLen = options.maxLen ?? 10000
  }
  public dispatchPrimary() {
    throw new Error('dispatch to primary is not supported')
  }
  public dispatchSecondary(message: Message) {
    this.redis.xadd(this.stream, 'MAXLEN', this.maxLen, '*', 'data', JSON.stringify(message.data))
  }
}
