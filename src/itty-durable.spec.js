require('isomorphic-fetch')

const { Router } = require('itty-router')
const { withDurables } = require('./with-durables')
const { createIttyDurable, IttyDurable } = require('./itty-durable')

describe('IttyDurable', () => {
  describe('works as base class for Durable Object classes', () => {
    class Counter extends IttyDurable {
      constructor(state, env) {
        super(state, env)
        this.counter = 0
      }
    }

    it('embeds this.router', () => {
      const counter = new Counter()
      expect(typeof counter.router.post).toBe('function')
    })

    it('instantiates normally (props from constructor)', () => {
      const counter = new Counter()
      expect(counter.counter).toBe(0)
    })
  })
})

