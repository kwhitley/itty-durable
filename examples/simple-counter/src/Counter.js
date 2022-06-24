import { createDurable } from '../../../src' // from 'itty-durable'

export class Counter extends createDurable({ autoReturn: true, autoPersist: true }) {
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
    return Number(a) + Number(b)
  }
}
