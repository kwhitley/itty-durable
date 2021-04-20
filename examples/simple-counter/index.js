import {
  error,
  json,
  missing,
  StatusError,
  text,
  ThrowableRouter,
  withParams,
} from 'itty-router-extras'
import { withDurables } from '../../src' // from 'itty-durable'

// export durable object class, per spec
export { Counter } from './Counter'

// create a basic router
const router = ThrowableRouter({ base: '/simple-counter', stack: true })

router
  // add upstream middleware
  .get('*', withDurables())

  // get get the durable itself... returns JSON Response, so no need to wrap
  .get('/', ({ Counter }) => Counter.get('test').toJSON())

  // example route with multiple calls to DO
  .get('/do-stuff',
    async ({ Counter }) => {
      const counter = Counter.get('test')

      // then we fire some methods on the durable... these could all be done separately.
      await Promise.all([
        counter.increment(),
        counter.increment(),
        counter.increment(),
      ])

      // all instance calls return a promise to a JSON-formatted Response
      // unless withDurables({ parse: true }) is used
      return counter.toJSON()
    }
  )

  // will pass on requests to the durable... (e.g. /add/3/4 => 7)
  .get('/:action/:a?/:b?', withParams,
    ({ Counter, action, a, b }) => Counter.get('test')[action](a, b)
  )

  // all else gets a 404
  .all('*', () => missing('Are you sure about that?'))

// CF ES6 module syntax
export default {
  fetch: router.handle
}

/*

Example Usage:

GET simple-counter/reset        --> { counter: 0 }
GET simple-counter/increment    --> { counter: 1 }
GET simple-counter/do-stuff     --> { counter: 4 }
GET simple-counter/do-stuff     --> { counter: 7 }
GET simple-counter/set/foo/bar  --> { counter: 7, foo: 'bar' }
GET simple-counter/increment    --> { counter: 8, foo: 'bar' }
GET simple-counter/add/40/2     --> 42

*/

