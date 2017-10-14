import Route from '../../src/model/Route'

describe('Route', () => {
  describe('#constructor', () => {
    it('should create Route', () => {
      const specs = new Map<string, Route>()
      const route = new Route('primary', ['secondary1', 'secondary2' ], specs)
      expect(route).toBeInstanceOf(Route)
      expect(route.primary).toEqual('primary')
      expect(route.secondary).toEqual(['secondary1', 'secondary2' ])
      expect(route.specs).toBeInstanceOf(Map)
    })

    it('should create Route only with primary', () => {
      const route = new Route('primary')
      expect(route.primary).toEqual('primary')
    })

    it('should create Route only with secondary', () => {
      const route = new Route(null, ['secondary1', 'secondary2'])
      expect(route.primary).toBeNull()
      expect(route.secondary).toEqual(['secondary1', 'secondary2' ])
    })

    it('should create Route only with specs', () => {
      const subRoute = new Route('primary', ['secondary1', 'secondary2'])
      const specs = new Map<string, Route>()
      specs.set('location', subRoute)
      const route = new Route(null, undefined, specs)
      expect(route.primary).toBeNull()
      expect(route.secondary).toEqual([])
      expect(route.specs).toEqual(specs)
    })
  })
})
