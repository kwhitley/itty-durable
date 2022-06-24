import {
  missing,
  StatusError,
  ThrowableRouter,
  withParams,
} from 'itty-router-extras'
import { withDurables } from '../../../src' // from 'itty-durable'

// import durable object classes to pass to withDurables middleware (only when accessing instance props)
import { Counter } from './Counter'
import { Counters } from './Counters'

// export durable object class, per spec
export { Counter, Counters }

const router = ThrowableRouter({ base: '/counters', stack: true })

// middleware to check existance of counter before continuing
const withExistingCounters = async ({ params, Counters }) => {
  const exists = await Counters.get('all', { parse: true }).has(params.id)

  if (!exists) {
    return missing(`Counter ${params.id} not found.`)
  }
}

// convenience middleware to expose a single instance of the Counters DO
const withListOfCounters = request => {
  request.ListOfCounters = request.Counters.get('all')
}

router
  // add withDurables() middleware, then withListOfCounters middleware
  .get('*', withDurables({ classes: { Counter, Counters } }), withListOfCounters)

  // expose Counters routes first
  .get('/', ({ ListOfCounters }) => ListOfCounters.counters)
  .get('/values', ({ ListOfCounters }) => ListOfCounters.values)
  .get('/total', ({ ListOfCounters }) => ListOfCounters.total)
  .get('/clear', ({ ListOfCounters }) => ListOfCounters.clearAll())
  .get('/create/:id', withParams, ({ id, ListOfCounters }) => ListOfCounters.create(id))
  .get('/delete/:id', withParams, ({ id, ListOfCounters }) => ListOfCounters.delete(id))

  // then failover to counters/:id routes
  .get('/:id', withParams, withExistingCounters, ({ id, Counter }) => Counter.get(id).toJSON())

  // for this, we execute unknown actions on the durable, passing in up to two params
  // Example: "counters/my-counter/add/4/7"
  .get('/:id/:action/:a?/:b?', withParams, withExistingCounters,
    ({ id, action, a, b, Counter }) => Counter.get(id)[action](a, b)
  )

  // all else gets a 404
  .all('*', () => missing('Are you sure about that?'))

// CF ES6 module syntax
export default {
  fetch: router.handle
}
