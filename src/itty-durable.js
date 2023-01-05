import { Router } from 'itty-router'
import {
  error,
  json,
  StatusError,
  withContent,
  withParams
} from 'itty-router-extras'
import { proxyDurable } from './proxy-durable'

// factory function for IttyDurable with custom options
export const createDurable = (options = {}) => {
  const {
    autoPersist = false,
    autoReturn = false,
    onError = err => error(err.status || 500, err.message),
  } = options

  return class IttyDurable {
    constructor(state = {}, env = {}) {
      this.state = state
      
      Object.assign(this.state, {
        defaultState: undefined,
        initialized: false,
        router: Router(),
        env,
        ...env,
      }

      // embed bindings into this.env
      for (const [key, binding] of Object.entries(env)) {
        this.state[key] = typeof binding.idFromName === 'function'
                        ? proxyDurable(binding, { name: key, parse: true })
                        : binding
      }

      // creates a proxy of this to return
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
      this.state.router
        .post('/:action/:target', withParams, withContent,
          async (request, env) => {
            const { action, target, content = [] } = request

            if (action === 'call') {
              if (typeof this[target] !== 'function') {
                throw new StatusError(500, `Durable Object state{this.constructor.name} does not contain method state{target}()`)
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

    // purge storage, and optionally reset internal memory state
    async destroy(options = {}) {
      const { reset = false } = options

      await this.state.storage.deleteAll()

      if (reset) {
        this.reset()
      }

      const destructionResponse = await this.onDestroy()

      // optionally return if onDestroy returns something
      if (destructionResponse) {
        return destructionResponse
      }
    }

    getAlarm() {
      return this.state.storage.getAlarm()
    }

    setAlarm(expiration) {
      return this.state.storage.setAlarm(expiration)
    }

    // fetch method is the expected interface method of Durable Objects per Cloudflare spec
    async fetch(request, ...args) {
      const idFromName = request.headers.get('itty-durable-idFromName')

      if (idFromName) {
        this.state.idFromName = idFromName
      }

      // save default state for reset
      if (!this.state.initialized) {
        this.state.defaultState = JSON.stringify(this.getPersistable())
      }

      // load initial state from storage (if found)
      await this.loadFromStorage()

      // we pass off the request to the internal router
      const response = await this.state.router
                                      .handle(request, ...args)
                                      .catch(onError)

      // if persistOnChange is true, we persist on every response
      if (autoPersist) {
        this.persist()
      }

      // provide an escape hatch for things like Alarms
      if (!response && this.fetchFallback) {
        return this.fetchFallback()
      }

      // then return the response
      return response || error(400, 'Bad request to durable object')
    }

    // gets persistable state (defaults to all but itty data)
    getPersistable() {
      const { state, ...persistable } = this

      return persistable
    }
    
    async block(callback) {  
      return  await this.state.blockConcurrencyWhile(callback)
    }

    async loadFromStorage() {
      if (!this.state.initialized) {
        const stored = await this.state.storage.get('data') || {}

        Object.assign(this, stored)

        // then run afterInitialization lifecycle function
        await this.onLoad()

        this.state.initialized = true
      }
    }

    async onDestroy() {
      // fires after this.destroy() is called
    }

    async onLoad() {
      // fires after object is loaded from storage
    }

    // returns self from methods that fail to return if autoReturn flag is enabled
    optionallyReturnThis() {
      if (autoReturn) {
        return json(this.toJSON
                    ? this.toJSON()
                    : this)
      }
    }

    // persists to storage, override to control
    async persist() {
      const { state, ...persistable } = this.getPersistable()

      await this.state.storage.put('data', persistable)
    }

    // resets object to preserved default state
    async reset() {
      const { state, ...persistable } = this.getPersistable()

      for (const key in persistable) {
        Reflect.deleteProperty(this, key)
      }

      // reset to defaults from constructor
      Object.assign(this, JSON.parse(this.state.defaultState))
    }

    // defaults to returning all content
    toJSON() {
      const { state, ...other } = this

      return other
    }
  }
}
