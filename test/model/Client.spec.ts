import { Priority } from '../../src/lib/Constants'
import Client from '../../src/model/Client'

describe('Client', () => {
  describe('#constructor', () => {
    it.only('should  create client', () => {
      const client = new Client('name', 'url', {default: Priority.PRIMARY})
      expect(client).toBeInstanceOf(Client)
      expect(client.name).toEqual('name')
      expect(client.url).toEqual('url')
    })
  })
})
