# ![itty-durable](https://user-images.githubusercontent.com/865416/175660491-4f428e41-47f5-4d43-92d3-02ce29309878.png)

[![npm package][npm-image]][npm-url]
![Build Status](https://github.com/kwhitley/itty-router/actions/workflows/verify.yml/badge.svg)
[![Open Issues][issues-image]][issues-url]
<a href="https://github.com/kwhitley/itty-durable" target="\_parent">
  <img alt="" src="https://img.shields.io/github/stars/kwhitley/itty-durable.svg?style=social&label=Star" />
</a>
<a href="https://twitter.com/kevinrwhitley" target="\_parent">
  <img alt="" src="https://img.shields.io/twitter/follow/kevinrwhitley.svg?style=social&label=Follow" />
</a>

Simplifies usage of [Cloudflare Durable Objects](https://blog.cloudflare.com/introducing-workers-durable-objects/), allowing **lightweight object definitions** and **direct access** to object methods from within Workers (no need for request building/handling).

## Features
- Removes nearly all boilerplate from writing **and** using Durable Objects.
- Optional automatic non-blocking persistance layer
- Optionally return contents from methods without explicit return (convenience feature)
- Control how contents of object looks to outside requests
- Control exactly what, if anything, is persisted
- Already being used in production on high-availability/throughput apps like the [Retheme](http://retheme.org/) browser extension!

## Example
##### Counter.js (your Durable Object class)
```js
import { createDurable } from 'itty-durable'

export class Counter extends createDurable({ autoReturn: true }) {
  constructor(state, env) {
    super(state, env)

    // anything defined here is only used for initialization (if not loaded from storage)
    this.counter = 0
  }

  // Because this function does not return anything, it will return the entire contents
  // Example: { counter: 1 }
  increment() {
    this.counter++
  }

  // Any explicit return will honored, despite the autoReturn flag.
  // Note that any serializable params can passed through from the Worker without issue.
  add(a, b) {
    return a + b
  }
}
```

##### Worker.js (your CF Worker function)
```js
import { ThrowableRouter, missing, withParams } from 'itty-router-extras'
import { withDurables } from 'itty-durable'

// export the durable class, per spec
export { Counter } from './Counter'

const router = ThrowableRouter({ base: '/counter' })

router
  // add upstream middleware, allowing Durable access off the request
  .all('*', withDurables())

  // get the durable itself... returns json response, so no need to wrap
  .get('/', ({ Counter }) => Counter.get('test').toJSON())

  // By using { autoReturn: true } in createDurable(), this method returns the contents
  .get('/increment', ({ Counter }) => Counter.get('test').increment())

  // you can pass any serializable params to a method... (e.g. /counter/add/3/4 => 7)
  .get('/add/:a?/:b?', withParams,
    ({ Counter, a, b }) => Counter.get('test').add(Number(a), Number(b))
  )

  // reset the durable
  .get('/reset', ({ Counter }) => Counter.get('test').reset())

  // 404 for everything else
  .all('*', () => missing('Are you sure about that?'))

// with itty, and using ES6 module syntax (required for DO), this is all you need
export default {
  fetch: router.handle
}

/*
Example Interactions:

GET /counter                                => { counter: 0 }
GET /counter/increment                      => { counter: 1 }
GET /counter/increment                      => { counter: 2 }
GET /counter/increment                      => { counter: 3 }
GET /counter/reset                          => { counter: 0 }
GET /counter/add/20/3                       => 23
*/
```

## How it Works
This library works via a two part process:

1. First of all, we create a base class for your Durable Objects to extend (through `createDurable()`).  This embeds the persistance layer, a few convenience functions, and most importantly, a tiny internal [itty-router](https://www.npmjs.com/package/itty-router) to handle fetch requests.  Using this removes the boilerplate from your objects themselves, allowing them to be **only** business logic.

2. Next, we expose the `withDurables()` middleware for use within your Workers (it is designed for drop-in use with [itty-router](https://www.npmjs.com/package/itty-router), but should work with virtually any typical Worker router).  This embeds proxied stubs (translation: "magic stubs") into the Request.  Using these stubs, you can call methods on the Durable Object directly, rather than manually creating fetch requests to do so (that's all handled internally, communicating with the embedded router within the Durable Objects themselves).

## Installation

```
npm install itty-durable
```

## API

### `createDurable(options?: object): class`
Factory function to create the IttyDurable class (with options) for your Durable Object to extend.

| Option | Type(s) | Default | Description |
| --- | --- | --- | --- |
| **autoPersist** | `boolean` | false | By default, all contents are stored in-memory only, and are cleared when the DO evacuates from memory (unless explicitly asked to persist).  By setting this to `true`, each request to the DO through the stub will persist the contents automatically.
| **autoReturn** | `boolean` | false | If set to `true`, methods without an explicit return will return the contents of the object itself (as controlled through the `toJSON()` method).  This method is overridable for custom payload shaping.

### `withDurables(options?: object): function`
Highly-recommended middleware to embed itty-durable stubs into the request.  Using these stubs allows you to skip manually creating/sending requests or handling response parsing.

| Option | Type(s) | Default | Description |
| --- | --- | --- | --- |
| **parse** | `boolean` | false | By default, the stub methods return a Promise to the Response from the Durable Object itself.  This is great if you're just passing the response along and don't want to modify it.  To take more control, setting this to `true` will instead return a Promise to the parsed JSON contents instead.  To then respond to requests, you would have to handle building of a JSON Response yourself (e.g. `json()` within itty-router-extras).

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
