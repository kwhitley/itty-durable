# ![itty-durable](https://user-images.githubusercontent.com/865416/175660491-4f428e41-47f5-4d43-92d3-02ce29309878.png)

[![npm package][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Open Issues][issues-image]][issues-url]
<a href="https://github.com/kwhitley/itty-durable" target="\_parent">
  <img alt="" src="https://img.shields.io/github/stars/kwhitley/itty-durable.svg?style=social&label=Star" />
</a>
<a href="https://twitter.com/kevinrwhitley" target="\_parent">
  <img alt="" src="https://img.shields.io/twitter/follow/kevinrwhitley.svg?style=social&label=Follow" />
</a>

Simplifies usage of [Cloudflare Durable Objects](https://blog.cloudflare.com/introducing-workers-durable-objects/), allowing lightweight object definitions and **direct access** to object methods from within Workers (no need for request building/handling).

## Features
- Removes nearly all boilerplate from writing Durable Objects and using them within Workers
- Automatically handles request building/handling internally via [itty-router](https://www.npmjs.com/package/itty-router)
- Universal middleware to add object proxies to Request (built for use with [itty-router](https://www.npmjs.com/package/itty-router), but should work with other Worker routers).
- Optional, automatic non-blocking persistance (persists after object response, and loads from storage automatically)
- Optionally return Durable contents from methods without explicit return (convenience feature)
- Control how contents of Durable look to outside requests
- Control what, if anything, is persisted

## Installation

```
npm install itty-durable
```

## Example
##### Counter.js (your durable object class)
```js
import { createIttyDurable } from 'itty-durable'

export class Counter extends createIttyDurable({ autoReturn: true }) {
  constructor(state, env) {
    super(state, env)

    // anything defined here is only used for initialization (if not loaded from storage)
    this.counter = 0
  }

  increment() {
    this.counter++

    // because this function does not return anything, it will return the entire contents
    // Example: { counter: 1 }
  }

  add(a, b) {
    // a function can explicitly return something insead
    return a + b
  }
}
```

##### Worker.js (your standard CF worker)
```js
import { ThrowableRouter, missing, withParams } from 'itty-router-extras'
import { withDurables } from 'itty-durable'

// export the durable class, per spec
export { Counter } from './Counter'

const router = ThrowableRouter({ base: '/counter' })

router
  // add upstream middleware, allowing Durable access off the request
  .all('*', withDurables())

  // get get the durable itself... returns json response, so no need to wrap
  .get('/', ({ Counter }) => Counter.get('test').toJSON())

  // example route with multiple calls to DO
  .get('/increment-a-few-times',
    async ({ Counter }) => {
      const counter = Counter.get('test') // gets DO with id/namespace = 'test'

      // then we fire some methods on the durable... these could all be done separately.
      await Promise.all([
        counter.increment(),
        counter.increment(),
        counter.increment(),
      ])

      // and return the contents (it'll be a json response)
      return counter.toJSON()
    }
  )

  // reset the durable)
  .get('/reset', ({ Counter }) => Counter.get('test').reset())

  // will pass on unknown requests to the durable... (e.g. /counter/add/3/4 => 7)
  .get('/:action/:a?/:b?', withParams,
    ({ Counter, action, a, b }) => Counter.get('test')[action](Number(a), Number(b))
  )

  // 404 for everything else
  .all('*', () => missing('Are you sure about that?'))

// with itty, and using ES6 module syntax (required for DO), this is all you need
export default {
  fetch: router.handle
}
```

### Interacting with it!
```
GET /counter/increment-a-few-times          => { counter: 3 }
GET /counter/increment-a-few-times          => { counter: 6 }
GET /counter/reset                          => { counter: 0 }
GET /counter/increment                      => { counter: 1 }
GET /counter/increment                      => { counter: 2 }
GET /counter/add/20/3                       => 23
GET /counter                                => { counter: 2 }
```
(more examples to come shortly, hang tight!)

## Exports

### `IttyDurable: class`
Base class to extend, with persistOnChange, but no timestamps.

### `createIttyDurable(options = {}): class`
Factory function for defining another IttyDurable class (different base options).

### `withDurables(options = {})`
This is the Worker middleware to put either on routes individually, up globally as an upstream route.  This allows requests for the DO binding directly off the request, and simplifies even the id translation.  Any durable stubs retrieved this way automatically talk to the router within IttyDurable (base class) when accessing instance methods on the stub, allowing all `fetch` boilerplate to be abstracted away.

[twitter-image]:https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Fitty-durable
[logo-image]:https://user-images.githubusercontent.com/865416/114285361-2bd3e180-9a1c-11eb-8386-a2e9f4383d43.png
[gzip-image]:https://img.shields.io/bundlephobia/minzip/itty-durable
[gzip-url]:https://bundlephobia.com/result?p=itty-durable
[issues-image]:https://img.shields.io/github/issues/kwhitley/itty-durable
[issues-url]:https://github.com/kwhitley/itty-durable/issues
[npm-image]:https://img.shields.io/npm/v/itty-durable.svg
[npm-url]:http://npmjs.org/package/itty-durable
[travis-image]:https://travis-ci.org/kwhitley/itty-durable.svg?branch=v0.x
[travis-url]:https://travis-ci.org/kwhitley/itty-durable
[david-image]:https://david-dm.org/kwhitley/itty-durable/status.svg
[david-url]:https://david-dm.org/kwhitley/itty-durable
[coveralls-image]:https://coveralls.io/repos/github/kwhitley/itty-durable/badge.svg?branch=v0.x
[coveralls-url]:https://coveralls.io/github/kwhitley/itty-durable?branch=v0.x

## Special Thanks
Big time thanks to all the fantastic developers on the Cloudflare Workers discord group, for their putting up with my constant questions, code snippets, and guiding me off the dangerous[ly flawed] path of async setters ;)

## Contributors
Let's face it, in open source, these are the real heroes... improving the quality of libraries out there for everyone!
 - **README tweaks, fixes, improvements**: [@tomByrer](https://github.com/tomByrer)
