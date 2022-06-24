import { json, StatusError } from 'itty-router-extras'

// helper function to parse response
const transformResponse = response => {
  try {
    return response.json()
  } catch (err) {}

  try {
    return response.text()
  } catch (err) {}

  return response
}

// takes the durable (e.g. env.Counter) and returns an object with { get(id) } to fetch the proxied stub
export const proxyDurable = (durable, middlewareOptions = {}) => {
  if (!durable || !durable.idFromName) {
    throw new StatusError(500, `${middlewareOptions.name || 'That'} is not a valid Durable Object binding.`)
  }

  return {
    get: (id, options = {}) => {
      options = { ...middlewareOptions, ...options }

      try {
        if (typeof id === 'string') {
          id = durable.idFromName(id)
        }

        const stub = durable.get(id)
        const mock = typeof options.class === 'function' && new options.class()
        const isValidMethod = prop => prop !== 'fetch' && (!mock || typeof mock[prop] === 'function')

        const buildRequest = (type, prop, content) => new Request(`https://itty-durable/${type}/${prop}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(content)
        })

        const stubFetch = (obj, type, prop, content) => {
          const theFetch = obj.fetch(buildRequest(type, prop, content))

          return options.parse
          ? theFetch.then(transformResponse)
          : theFetch
        }

        return new Proxy(stub, {
          get: (obj, prop) => isValidMethod(prop)
                              ? (...args) => stubFetch(obj, 'call', prop, args)
                              : stubFetch(obj, 'get-prop', prop),
          set: (obj, prop, value) => stubFetch(obj, 'set', prop, value),
        })
      } catch (err) {
        throw new StatusError(500, err.message)
      }
    }
  }
}
