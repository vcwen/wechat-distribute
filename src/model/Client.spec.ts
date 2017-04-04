import * as chai from 'chai'
import Client from './Client'
const expect = chai.expect

describe('Client', () => {
  describe('#constructor', () => {
    it('should  create client', () => {
      const client = new Client('name', 'url')
      expect(client).to.be.instanceof(Client)
      expect(client.name).to.equal('name')
      expect(client.url).to.equal('url')
    })
  })
})
