const { Router } = require('itty-router')
const {
  error,
  json,
  withParams,
  withContent,
  StatusError,
} = require('itty-router-extras')

const { proxyDurable } = require('./proxy-durable')

const createIttyDurable = (options = {}) => {
  const {
    persistOnChange = true,
    alwaysReturnThis = true,
    onError = err => error(err.status || 500, err.message),
  } = options

  return class IttyDurableBase {
    constructor(state = {}, env = {}) {
      this.state = {
        defaultState: undefined,
        ...env,
        ...state,
      }

      this.storage = state.storage

      // embed bindings into this.env
      for (const [key, binding] of Object.entries(env)) {
        this.state[key] = typeof binding.idFromName === 'function'
                        ? proxyDurable(binding, { name: key, parse: true })
                        : binding
      }

      // embed a throwable router into
      this.router = Router()

      const proxied = new Proxy(this, {
        get: (obj, prop, receiver) => typeof obj[prop] === 'function'
                            ? obj[prop].bind(receiver)
                            : obj[prop],

        // track isDirty
        set: (obj, prop, value) => {
          if (obj[prop] !== value) {
            this.state.isDirty = true
          }
          obj[prop] = value

          return true
        }
      })

      // one router to rule them all
      this.router
        .post('/:action/:target', withParams, withContent,
          async (request, env) => {
            const { action, target, content = [] } = request

            if (action === 'call') {
              if (typeof this[target] !== 'function') {
                throw new StatusError(500, `Durable Object ${this.constructor.name} does not contain method ${target}()`)
              }
              const response = await proxied[target](...content)

              // return early if response detected
              if (response !== undefined) {
                return response instanceof Response
                ? response
                : json(response)
              }
            } else if (action === 'set') {
              proxied[target] = content
            } else if (action === 'get-prop') {
              return json(await proxied[target])
            }
          },
          proxied.optionallyPersist,
          proxied.optionallyReturnThis,
        )

      return proxied
    }

    // gets persistable state (defaults to all but itty data)
    getPersistable() {
      const { state, storage, router, ...persistable } = this

      return persistable
    }

    // persists to storage, override to control
    async persist() {
      if (this.state.isDirty) {
        await this.storage.put('data', this.getPersistable())
      }
    }

    async loadFromStorage() {
      const stored = await this.storage.get('data') || {}

      Object.assign(this, stored)

      this.state.isDirty = false
    }

    // initializes from storage, override to control
    async initialize() {
      // INITIALIZATION
      if (!this.state.initializePromise) {
        // save default state before loading from storage
        this.state.defaultState = JSON.stringify(this.getPersistable())

        this.state.initializePromise = this.loadFromStorage().catch(err => {
          this.state.initializePromise = undefined
          throw err
        })
      }
      await this.state.initializePromise
    }

    async fetch(...args) {
      // INITIALIZATION
      await this.initialize()
      this.state.isDirty = false

      // we pass off the request to the internal router
      const response = await this.router
                                    .handle(...args)
                                    .catch(onError)

      // then return the response
      return response || error(400, 'Bad request to durable object')
    }

    async optionallyPersist(request, env = {}, ctx = {}) {
      if (persistOnChange) {
        if (ctx.waitUntil) {
          ctx.waitUntil(this.persist())
        } else {
          await this.persist()
        }
      }
    }

    reset() {
      for (const key in this.getPersistable()) {
        Reflect.deleteProperty(this, key)
      }

      // reset to defaults from constructor
      Object.assign(this, JSON.parse(this.state.defaultState))
    }

    destroy() {
      return this.storage.deleteAll()
    }

    optionallyReturnThis() {
      if (alwaysReturnThis) {
        return json(this.toJSON ? this.toJSON() : this)
      }
    }

    toJSON() {
      return this.getPersistable()
    }
  }
}

const IttyDurable = createIttyDurable() // we accept sane defaults

module.exports = {
  createIttyDurable,
  IttyDurable,
}
