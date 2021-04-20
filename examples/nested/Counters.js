import { IttyDurable } from '../../src' // from 'itty-durable'
import { missing, error } from 'itty-router-extras'
import { Counter as CounterClass } from './Counter'

// helper sort function
const ascending = (a, b) => a > b ? 1 : -1

// this is just a list of counter (ids) with helper functions to check existance, create, delete, etc
export class Counters extends IttyDurable {
  constructor(...args) {
    super(...args)
    this.counters = []
  }

  // adds counter key to list
  create(id) {
    if (this.has(id)) {
      return error(400, `Counter "${id}" already exists.`)
    }

    this.counters = [ ...this.counters, id ].sort(ascending)
  }

  // returns true|false if counter id exists in the list
  has(id) {
    return this.counters.includes(id)
  }

  // removes counter key (destroying storage for Counter durable)
  async delete(id) {
    const { Counter } = this.state // get another durable stub

    if (!this.has(id)) {
      return missing(`Counter ${id} does not exist.`)
    }

    // clear out counter storage
    await Counter.get(id).destroy()

    // then remove it from list
    this.counters = this.counters.filter(key => key !== id)
  }

  // removes counter key (destroying storage for Counter durable)
  async clearAll(id) {
    const { Counter } = this.state // get another durable stub

    // remove all counter storages
    await Promise.all(this.counters.map(id => Counter.get(id).destroy()))

    this.counters = []
  }

  // return a total of child counters
  get values() {
    const { Counter } = this.state // get another durable stub

    return Promise.all(
      this.counters.map(id => Counter.get(id, { class: CounterClass }).counter)
    )
  }

  // return a total of child counters
  get total () {
    return this.values.then(values => values.reduce((sum, value) => sum += (value || 0), 0))
  }
}
