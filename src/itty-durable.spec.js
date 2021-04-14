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

    describe('extends class with methods', () => {
      const counter = new Counter()

      it('.toJSON()', () => {
        expect(typeof counter.toJSON).toBe('function')
      })

      it('.getPersistable()', () => {
        expect(typeof counter.getPersistable).toBe('function')
      })

      it('.initialize()', () => {
        expect(typeof counter.initialize).toBe('function')
      })

      it('.fetch()', () => {
        expect(typeof counter.fetch).toBe('function')
      })

      it('.persist()', () => {
        expect(typeof counter.persist).toBe('function')
      })
    })

  })
})

