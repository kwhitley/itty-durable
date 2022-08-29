import { Router } from 'itty-router'
import {
  error,
  json,
  missing,
  StatusError,
  text,
  ThrowableRouter,
  withParams,
} from 'itty-router-extras'
import { withDurables } from '../../../src' // from 'itty-durable'

// export durable object class, per spec
export { Human } from './Human'
export { Pet } from './Pet'

// create a basic router
const router = Router({ base: '/advanced' })

router
  // add upstream middleware
  .get('*', withDurables())

  // get get the durable itself... returns JSON Response, so no need to wrap
  .get('/human/:name', withParams, ({ name, Human }) => Human.get(name).toJSON())

  // same for pets
  .get('/pet/:name', withParams, ({ name, Pet }) => Pet.get(name).toJSON())

  .get('/pet/:petName/addHuman/:humanName', withParams,
    ({ petName, humanName, Pet }) => Pet.get(petName).add(humanName)
  )

  .get('/human/:humanName/addPet/:petName', withParams,
    ({ petName, humanName, Human }) => Human.get(humanName).add(petName)
  )

  // all else gets a 404
  .all('*', () => missing('Are you sure about that?'))

// CF ES6 module syntax
export default {
  fetch: (...args) => router
                        .handle(...args)
                        .catch(err => error(500, err.message))
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

