# ![Itty Durable][logo-image]

[![npm package][npm-image]][npm-url]
[![minified + gzipped size][gzip-image]][gzip-url]
[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![Open Issues][issues-image]][issues-url]
<a href="https://npmjs.com/package/itty-durable" target="\_parent">
  <img alt="" src="https://img.shields.io/npm/dm/itty-durable.svg" />
</a>
<a href="https://github.com/kwhitley/itty-durable" target="\_parent">
  <img alt="" src="https://img.shields.io/github/stars/kwhitley/itty-durable.svg?style=social&label=Star" />
</a>
<a href="https://twitter.com/kevinrwhitley" target="\_parent">
  <img alt="" src="https://img.shields.io/twitter/follow/kevinrwhitley.svg?style=social&label=Follow" />
</a>



## Installation

```
npm install itty-router itty-router-extras itty-durable
```

## Example
##### Counter.js
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

##### Worker.js
```js
import { ThrowableRouter, withParams } from 'itty-router-extras'

router
  // add upstream middleware, allowing Durable access
  .all('*', withDurables())

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

  // get get the durable itself... returns json response, so no need to wrap
  .get('/counter', ({ Counter }) => Counter.get('test').toJSON())

  // reset the durable)
  .get('/counter/reset', ({ Counter }) => Counter.get('test').clear())

  // will pass on requests to the durable... (e.g. /counter/add/3/4 => 7)
  .get('/counter/:action/:a?/:b?', withParams,
    ({ Counter, action, a, b }) => Counter.get('test')[action](Number(a), Number(b))
  )

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }))

// attach the router "handle" to the event handler
addEventListener('fetch', event =>
  event.respondWith(router.handle(event.request))
)
```

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

## Contributors
These folks are the real heroes, making open source the powerhouse that it is!  Help out and get your name added to this list! <3

#### Core, Concepts, and Codebase
- [@technoyes](https://github.com/technoyes) - three kind-of-a-big-deal errors fixed.  Imagine the look on my face... thanks man!! :)
- [@hunterloftis](https://github.com/hunterloftis) - router.handle() method now accepts extra arguments and passed them to route functions
- [@roojay520](https://github.com/roojay520) - TS interface fixes
- [@mvasigh](https://github.com/mvasigh) - proxy hacks courtesy of this chap
#### Documentation Fixes
- [@arunsathiya](https://github.com/arunsathiya)
- [@poacher2k](https://github.com/poacher2k)
