class Route {
  public primary?: string
  public secondary: string[]
  public specs: Map <string, Route>
  constructor(primary?: string, secondary?: string[] | string,
    specs: Map <string, Route> = new Map<string, Route>()) {
    this.primary = primary
    if (!secondary) {
      this.secondary = []
    } else {
      this.secondary = Array.isArray(secondary) ? secondary : [secondary]
    }
    this.specs = specs
  }
}

export default Route
