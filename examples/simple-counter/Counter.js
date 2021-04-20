import { IttyDurable } from '../../src' // from 'itty-durable'

export class Counter extends IttyDurable {
  constructor(state, env) {
    super(state, env)
    this.counter = 0
  }

  increment() {
    this.counter++
  }

  set(prop, value) {
    this[prop] = value
  }

  add(a, b) {
    return a + b
  }
}
