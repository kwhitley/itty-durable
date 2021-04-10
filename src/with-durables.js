const { StatusError } = require('itty-router-extras')

const withDurables = (options = {}) => (request, env) => {
  const { autoParse = false } = options

  const transformResponse = response => {
    if (!autoParse) return response

    try {
      return response.json()
    } catch (err) {}

    try {
      return response.text()
    } catch (err) {}

    return new Promise(cb => cb())
  }

  request.durables = new Proxy(env, {
    get: (obj, binding) => {
      const durableBinding = env[binding]
      if (!durableBinding || !durableBinding.idFromName) {
        throw new StatusError(500, `${binding} is not a valid Durable Object binding.`)
      }

      return {
        get: (id, Class) => {
          try {
            if (typeof id === 'string') {
              id = durableBinding.idFromName(id)
            }

            const stub = durableBinding.get(id)
            const mock = typeof Class === 'function' && new Class(request, env)
            // const isValidMethod = prop => prop !== 'fetch'// && Object.getOwnPropertyNames(Class.prototype).includes('prop')
            const isValidMethod = prop => prop !== 'fetch' && (!mock || typeof mock[prop] === 'function')

            return new Proxy(stub, {
              get: (obj, prop) => isValidMethod(prop)
                                ? (...args) => {
                                    const url = `https://itty-durable/call/${prop}`
                                    const req = {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify(args)
                                    }

                                    return obj.fetch(url, req).then(transformResponse)
                                  }
                                : obj.fetch(`https://itty-durable/get-prop/${prop}`, { method: 'POST' }).then(transformResponse)
              ,
              set: (obj, prop, value) =>
                obj.fetch(`https://itty-durable/set/${prop}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(value)
                })
            })
          } catch (err) {
            throw new StatusError(500, err.message)
          }
        }
      }
    }
  })

  request.proxy = new Proxy(request.proxy || request, {
    get: (obj, prop) => obj.hasOwnProperty(prop)
                        ? obj[prop]
                        : obj.durables[prop]
  })
}

module.exports = { withDurables }
