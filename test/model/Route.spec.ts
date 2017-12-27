import { Priority } from '../../src/lib/Constants'
import Route from '../../src/model/Route'

describe('Route', () => {
  describe('#constructor', () => {
    it('should create Route', () => {
      const specs = new Map<string, Route>()
      const route = new Route('primary', 'image', 'http://test.com/test', Priority.PRIMARY)
      expect(route).toBeInstanceOf(Route)
      expect(route.name).toEqual('primary')
      expect(route.event).toEqual('image')
      expect(route.url).toEqual('http://test.com/test')
      expect(route.priority).toEqual(Priority.PRIMARY)
    })

    it('should has default priority secondary', () => {
      const route = new Route('primary', 'image', 'http://test.com/test')
      expect(route.priority).toEqual(Priority.SECONDARY)
    })
  })
})
