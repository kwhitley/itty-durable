const { proxyDurable } = require('./proxy-durable')

const withDurables = (options = {}) => (request, env) => {
  const { autoParse = false } = options

  request.durables = new Proxy(env, {
    get: (obj, prop) => proxyDurable(obj[prop])
  })

  request.proxy = new Proxy(request.proxy || request, {
    get: (obj, prop) => obj.hasOwnProperty(prop)
                        ? obj[prop]
                        : obj.durables[prop]
  })
}

module.exports = { withDurables }
