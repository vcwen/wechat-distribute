import { Priority } from '../lib/Constants'

export class Route {
  public name: string
  public event: string
  public url: string
  public priority: Priority
  constructor(name: string, event: string, url: string, priority: Priority = Priority.SECONDARY) {
    this.name = name
    this.event = event
    this.url = url
    this.priority = priority
  }
}

export default Route
