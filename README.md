# ![Itty Durable][logo-image]

[![npm package][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Open Issues][issues-image]][issues-url]
<a href="https://github.com/kwhitley/itty-durable" target="\_parent">
  <img alt="" src="https://img.shields.io/github/stars/kwhitley/itty-durable.svg?style=social&label=Star" />
</a>
<a href="https://twitter.com/kevinrwhitley" target="\_parent">
  <img alt="" src="https://img.shields.io/twitter/follow/kevinrwhitley.svg?style=social&label=Follow" />
</a>

## TLDR; [Cloudflare Durable Objects](https://blog.cloudflare.com/introducing-workers-durable-objects/) + [Itty Router](https://www.npmjs.com/package/itty-router) = [much shorter code](#example)

This takes the extreme stateful power of [Cloudflare Durable Objects](https://blog.cloudflare.com/introducing-workers-durable-objects/) (now in open beta), but drastically cuts down on the boilerplate to use them by pairing it with the flexibility of [Itty Router](https://www.npmjs.com/package/itty-router).  Currently, the only way to communicate to durable objects (DO) is via fetch, requiring internal routing/handling of requests inside the DO, as well as building/passing the request in from a Worker or other DO in the first place.  On top of that, there are a couple steps to even get the instance "stub" to work with in the first place, before you can call `fetch` on it.

IttyDurable offers a shortcut.

By having your durable objects extend the `IttyDurable` base class, it creates automatic internal routing/fetch handling via a tiny, embedded [Itty Router](https://www.npmjs.com/package/itty-router).  This allows you to ignore the initialization (from storage) step, as well as the `fetch` call itself from inside the DO, instead using the internal router for access/flow.

By adding in the next piece, the `withDurables()` middleware to the calling router (the outside Worker usually), we make this even more elegant.  Now, you can typically ignore the durable object router entirely, and instead call methods (or await properties) directly on the stub itself.  Under the hood, this fires a fetch that the built-in router will handle, firing the appropriate method, and passing (json-parsable) arguments in from the request.

**DISCLAIMER: This is very much a "working prototype" and will be hardened over the coming weeks with the help of folks on the CF Discord group, and your feedback (in issues).  API changes, polls, etc will be broadcast on the #durable-objects channel of that server, as well as on [Twitter](https://twitter.com/kevinrwhitley).  Please follow along there (or follow me) for updates and to communicate feedback!  Additionally, I'll be putting together a screencast/explanation on YouTube to show how it works - hopefully that can inspire someone else to come along and make it even better!**

## Installation

```
npm install itty-durable itty-router itty-router-extras
```

## Example
##### Counter.js (your durable object class)
```js
import { IttyDurable } from 'itty-durable'

export class Counter extends IttyDurable {
  constructor(state, env) {
    super(state, env)
    this.counter = 0
  }

  increment() {
    this.counter++
  }

  add(a, b) {
    return a + b
  }
}
```

##### Worker.js (your standard CF worker)
```js
import { ThrowableRouter, missing, withParams } from 'itty-router-extras'

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
  .get('/reset', ({ Counter }) => Counter.get('test').clear())

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

## Features
- Removes nearly all boilerplate from Durable Objects
- Allows you to fire instance methods directly on stub (will asynchronously call the same on Durable Object)
- Optional persistance (on change)
- Optional created/modified timestamps

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
