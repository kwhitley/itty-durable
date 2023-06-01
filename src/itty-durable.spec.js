require('isomorphic-fetch')
import { describe, it, expect } from 'vitest'
import { createDurable } from './itty-durable'

describe('createDurable', () => {
  describe('works as base class factory function for Durable Object classes', () => {
    class Counter extends createDurable() {
      constructor(state, env) {
        super(state, env)
        this.counter = 0
      }
    }

    it('embeds this.router', () => {
      const counter = new Counter()
      expect(typeof counter.state.router.post).toBe('function')
    })

    it('instantiates normally (props from constructor)', () => {
      const counter = new Counter()
      expect(counter.counter).toBe(0)
    })

    describe('extends class with methods', () => {
      const counter = new Counter()

      const expectedMethods = [
        'destroy',
        'fetch',
        'getPersistable',
        'loadFromStorage',
        'optionallyReturnThis',
        'persist',
        'reset',
        'toJSON',
      ]

      for (const method of expectedMethods) {
        it(`extends class with method "${method}"`, () => {
          expect(typeof counter[method]).toBe('function')
        })
      }

      // it('.toJSON()', () => {
      //   expect(typeof counter.toJSON).toBe('function')
      // })

      // it('.destroy()', () => {
      //   expect(typeof counter.destroy).toBe('function')
      // })

      // it('.getPersistable()', () => {
      //   expect(typeof counter.getPersistable).toBe('function')
      // })

      // it('.fetch()', () => {
      //   expect(typeof counter.fetch).toBe('function')
      // })

      // it('.persist()', () => {
      //   expect(typeof counter.persist).toBe('function')
      // })
    })

    // describe('embeds state and env into this.state', () => {
    //   const STATE_VALUE = 'some state value'
    //   const ENV_VALUE = 'some env value'
    //   const state = { STATE_VALUE }
    //   const env = { ENV_VALUE }

    //   const counter = new Counter(state, env)

    //   expect(counter.state.STATE_VALUE).toEqual(STATE_VALUE)
    //   expect(counter.state.ENV_VALUE).toEqual(ENV_VALUE)
    // })

    // describe('leaves access to the router', () => {
    //   const counter = new Counter()

    //   expect(1).toBe(1)
    //   expect(typeof counter.state.router).toBe('object')
    // })

    describe('getPersistable()', () => {
      const counter = new Counter()

      it('by default, returns only user-embedded data', () => {
        expect(counter.getPersistable()).toEqual({ counter: 0 })
      })

      it('will catch new data added', () => {
        counter.foo = 'bar'
        expect(counter.getPersistable()).toEqual({ counter: 0, foo: 'bar' })
      })

      it('is overridable', () => {
        class CustomCounter extends createDurable() {
          constructor(state, env) {
            super(state, env)
            this.counter = 1
            this.hidden = 'secret'
          }

          getPersistable() {
            return this.counter
          }
        }

        const counter = new CustomCounter()

        expect(counter.getPersistable()).toEqual(1)
      })
    })
  })
})

