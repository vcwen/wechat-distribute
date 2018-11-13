import { Priority } from '../lib/Constants'

export class Interest {
  public event: string
  public priority: Priority
  constructor(event: string, priority: Priority) {
    this.event = event
    this.priority = priority
  }
}
