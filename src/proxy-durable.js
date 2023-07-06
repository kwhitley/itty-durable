import { StatusError } from 'itty-router'

const catchErrors = async response => {
  if (response.ok || response.status === 101) return response

  let body

  try {
    body = await response.json()
  } catch (err) {
    body = await response.text()
  }

  throw new StatusError(response.status, body?.error || body || response.statusText)
}

// helper function to parse response
const transformResponse = async response => {
  const contentType = response.headers.get('content-type')
  let body

  try {
    if (contentType.includes('json')) {
      body = await response.json()
    } else if (contentType.includes('text')) {
      body = await response.text()
    }

    return body
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

      const headers = options.headers || {}
      // const originalHeaders = Object.fromEntries(options.request.headers)

      try {
        if (!id) id = durable.newUniqueId()

        if (typeof id === 'string') {
          const existingId = /^[0-9a-fA-F]{64}$/
          if (existingId.test(id)) {
            id = durable.idFromString(id)
          } else {
            headers['do-name'] = id
            id = durable.idFromName(id)
          }
        }

        const stub = durable.get(id)
        const mock = typeof options.class === 'function' && new options.class()
        const isValidMethod = prop => prop !== 'fetch' && (!mock || typeof mock[prop] === 'function')

        const buildRequest = (type, prop, content) =>
          new Request(`https://itty-durable/do/${type}/${prop}`, {
            headers: {
              ...headers,
              'do-content': JSON.stringify(content),
            },
          })

        const stubFetch = (obj, type, prop, content) => {
          const theFetch = obj
                            .fetch(buildRequest(type, prop, content))
                            .then(catchErrors)

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
