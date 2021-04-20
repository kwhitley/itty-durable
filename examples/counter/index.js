import {
  error,
  json,
  missing,
  StatusError,
  text,
  ThrowableRouter,
  withParams,
} from 'itty-router-extras'
import { withDurables } from 'itty-durable'

// need to import durable object class to pass to durables middleware (only when accessing instance props)
import { Counter } from './Counter'

// export durable object class, per spec
export { Counter }

const router = ThrowableRouter({ base: '/itty-durable/counter', stack: true })

router
  .get('/parsed', withDurables({ autoParse: true }),
    async ({ Counter }) => {
      // this is now returned parsed JSON, not a Response so that we may explode it
      const { counter, modified } = await Counter.get('test').toJSON()

      return text(`Counter value ${counter} last changed at ${modified}`)
    }
  )

  // add upstream middleware to allow for all DO instance counter below
  .all('*', withDurables())

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
      // unless withDurables({ autoParse: true }) is used
      return counter.toJSON()
    }
  )

  // get get the durable itself... returns JSON Response, so no need to wrap
  .get('/', ({ Counter }) => Counter.get('test').toJSON())

  // to access/return a DO property directly, must pass base class to stub.get(id, Class)
  .get('/value', request => request.Counter.get('test', Counter).counter)

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
