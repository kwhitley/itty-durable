require('isomorphic-fetch')

import { proxyDurable } from './proxy-durable'

describe('proxyDurable(durable:object, options?:object)', () => {
  it('returns an object with .get(id)', () => {
    const proxied = proxyDurable({ idFromName: () => {} })
    expect(proxied).toHaveProperty('get')
  })

  it('throws if passed invalid durable object', () => {
    expect(() => { proxyDurable({}) }).toThrow()
  })
})
