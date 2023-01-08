import { StatusError } from 'itty-router-extras'
import { proxyDurable } from './proxy-durable'

// returns true if binding appears to be a durable binding
const isDurable = (binding) => typeof binding.idFromName === 'function'

export const withDurables = (options = {}) => (request, env) => {
  const {
    parse = false,
    classes = {},
  } = options
  request.durables = request.durables || {}

  for (const [key, binding] of Object.entries(env)) {
    if (isDurable(binding)) {
      const proxied = proxyDurable(binding, {
        name: key,
        class: classes[key], // pass in class key by default,
        headers: Object.fromEntries(request.headers),
        env,
        parse,
      })

      try {
        request[key] = request.durables[key] = proxied
      } catch (err) {
        throw new StatusError(500, `Could not set Durable binding "${key}" on Request`)
      }
    }
  }
}
