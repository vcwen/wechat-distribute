export class Route {
  public topic: string
  public primary?: string
  public secondary: string[] = []
  public exclude: string[] = []
  public parent?: Route
  constructor(topic: string, primary?: string, secondary?: string[], exclude?: string[], parent?: Route) {
    this.topic = topic
    this.primary = primary
    this.secondary = secondary ?? []
    this.exclude = exclude ?? []
    this.parent = parent
  }
}
