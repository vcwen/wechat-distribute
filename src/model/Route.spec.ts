import * as chai from 'chai'
import Route from './Route'
const expect = chai.expect

describe('Route', () => {
  describe('#constructor', () => {
    it('should create Route', () => {
      const specs = new Map<string, Route>()
      const route = new Route('primary', ['secondary1', 'secondary2' ], specs)
      expect(route).to.be.instanceof(Route)
      expect(route.primary).to.equal('primary')
      expect(route.secondary).to.deep.equal(['secondary1', 'secondary2' ])
      expect(route.specs).to.be.instanceof(Map)
    })

    it('should create Route only with primary', () => {
      const route = new Route('primary')
      expect(route.primary).to.equal('primary')
    })

    it('should create Route only with secondary', () => {
      const route = new Route(null, ['secondary1', 'secondary2'])
      expect(route.primary).to.be.null
      expect(route.secondary).to.deep.equal(['secondary1', 'secondary2' ])
    })

    it('should create Route only with specs', () => {
      const subRoute = new Route('primary', ['secondary1', 'secondary2'])
      const specs = new Map<string, Route>()
      specs.set('location', subRoute)
      const route = new Route(null, undefined, specs)
      expect(route.primary).to.be.null
      expect(route.secondary).to.be.empty
      expect(route.specs).to.deep.equal(specs)
    })
  })
})
