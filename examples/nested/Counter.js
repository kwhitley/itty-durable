import { IttyDurable } from './itty-durable'

export class Counter extends IttyDurable {
  constructor(state, env) {
    super(state, env)
    this.counter = 0
  }

  increment() {
    this.counter = (this.counter || 0) + 1
  }

  // set some arbitrary info into the DO
  set(prop, value) {
    this[prop] = value
  }

  // just a random function showing that you can pass arguments from Worker or other DO
  add(a, b) {
    return Number(a) + Number(b)
  }
}
