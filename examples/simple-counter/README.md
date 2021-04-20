# itty-durable Example

This is an example showing general usage of itty-durable (simplification of [Cloudflare Durable Objects](https://developers.cloudflare.com/workers/learning/using-durable-objects)). The only two files to note are [Counter.js](https://github.com/kwhitley/itty-durable-example/blob/master/Counter.js) (the Durable Object) and [index.js](https://github.com/kwhitley/itty-durable-example/blob/master/index.js) (the Worker index).  Beyond that, you may notice some slight differences to the `wrangler.toml` file to support ES module builds (required for Durable objects), and a slightly different signature at the bottom of [index.js](https://github.com/kwhitley/itty-durable-example/blob/master/index.js).  Hit me up on [Twitter @kevinrwhitley](https://twitter.com/kevinrwhitley) (or the Cloudflare workers discord, #durable-objects channel) with any questions!

### Getting started:
1. clone repo
2. `npm install`
3. rename `wrangler.toml.example` to `wrangler.toml` and inject your own endpoints/account/zone
4. `wrangler publish --new-class Counter` (first time publishing)
5. `wrangler publish` (subsequent times)

### Example endpoint usage (with output):
```js
// GET https://example.com/counter/reset
{
  "created": "2021-04-13T17:33:45.097Z",
  "counter": 0,
  "modified": "2021-04-13T19:31:15.668Z"
}

// GET https://example.com/counter/do-stuff
// GET https://example.com/counter/do-stuff
{
"created": "2021-04-13T17:33:45.097Z",
"counter": 6,
"modified": "2021-04-13T19:31:52.770Z"
}

// GET https://example.com/counter/value
6

// https://example.com/counter/parsed
Counter value 6 last changed at 2021-04-13T19:31:52.770Z

// GET https://example.com/counter/set/foo/bar
{
  "counter": 6,
  "created": "2021-04-13T17:33:45.097Z",
  "modified": "2021-04-13T20:45:58.892Z",
  "foo": "bar"
}

// GET https://example.com/counter/increment
{
  "counter": 7,
  "created": "2021-04-13T17:33:45.097Z",
  "modified": "2021-04-13T20:45:58.892Z",
  "foo": "bar"
}

// GET https://example.com/counter/add/40/2
42
```
