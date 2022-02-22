import { IncomingMessage, ServerResponse } from 'http'
import { Message } from './message'
import Redis, { RedisOptions } from 'ioredis'
import { HttpService } from './http-service'

export interface DispatchOptions {
  isPrimary: boolean
  request?: IncomingMessage
  response?: ServerResponse
}

export abstract class Dispatcher {
  public type: string
  constructor(public name: string) {}
  public abstract dispatchPrimary(message: Message, req: IncomingMessage, res: ServerResponse)
  public abstract dispatchSecondary(message: Message, req: IncomingMessage)
}

export enum ContentType {
  ORIGINAL = 'original',
  JSON = 'json'
}

export interface HttpDispatchOptions extends DispatchOptions {
  request: IncomingMessage
  response: ServerResponse
  contentType: string
  auth?: { type: string; scheme: string; bearerFormat?: string }
}

export class HttpDispatcher extends Dispatcher {
  private httpService: HttpService = new HttpService()
  public contentType: ContentType
  public url: string
  public auth: { type: string; scheme: string; bearerFormat?: string }
  constructor(name: string, url: string, contentType: ContentType) {
    super(name)
    this.url = url
    this.contentType = contentType
  }
  public dispatchPrimary(message: Message, req: IncomingMessage, res: ServerResponse) {
    this.httpService.dispatchMessage(message, {
      isPrimary: true,
      request: req,
      response: res,
      url: this.url,
      contentType: this.contentType,
      auth: this.auth
    })
  }
  public dispatchSecondary(message: Message, req: IncomingMessage) {
    this.httpService.dispatchMessage(message, {
      isPrimary: false,
      request: req,
      url: this.url,
      contentType: this.contentType,
      auth: this.auth
    })
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
