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
    autoPersist = false,
    autoReturnThis = false,
    onError = err => error(err.status || 500, err.message),
  } = options

  return class IttyDurableBase {
    constructor(state = {}, env = {}) {
      this.state = {
        defaultState: undefined,
        initialized: false,
        ...env,
        ...state,
      }

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

        set: (obj, prop, value) => {
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
          proxied.optionallyReturnThis,
        )

      return proxied
    }

    // gets persistable state (defaults to all but itty data)
    getPersistable() {
      const { state, router, ...persistable } = this

      return persistable
    }

    // persists to storage, override to control
    async persist() {
      await this.state.storage.put('data', this.getPersistable())
    }

    async loadFromStorage() {
      if (!this.state.initialized) {
        const stored = await this.state.storage.get('data') || {}

        Object.assign(this, stored)
        this.state.initialized = true
      }
    }

    async fetch(...args) {
      // save default state for reset
      this.saveDefaultState()

      await this.loadFromStorage()

      // we pass off the request to the internal router
      const response = await this.router
                                    .handle(...args)
                                    .catch(onError)

      // if persistOnChange is true, we persist on every response
      if (persistOnChange) {
        this.persist()
      }

      // then return the response
      return response || error(400, 'Bad request to durable object')
    }

    reset() {
      for (const key in this.getPersistable()) {
        Reflect.deleteProperty(this, key)
      }

      // reset to defaults from constructor
      Object.assign(this, JSON.parse(this.state.defaultState))
    }

    // purge storage, and optionally reset internal memory state
    async destroy(options = {}) {
      const { reset = false } = options

      await this.state.storage.deleteAll()

      if (reset) {
        this.reset()
      }
    }

    optionallyReturnThis() {
      if (alwaysReturnThis) {
        return json(this.toJSON
                    ? this.toJSON()
                    : this)
      }
    }

    saveDefaultState() {
      if (!this.state.initialized) {
        this.state.defaultState = JSON.stringify(this.getPersistable())
      }
    }

    toJSON() {
      return this.getPersistable()
    }
  }
}

export const SimpleDurable = createIttyDurable()

// export
export const AutoDurable = createIttyDurable({
  autoPersist: true,
  autoReturnThis: true,
})

module.exports = {
  createIttyDurable,
  IttyDurable,
}
