import { createDurable } from '../../../src' // from 'itty-durable'

export class Counter extends createDurable({ autoReturn: true, autoPersist: true }) {
  constructor(state, env) {
    super(state, env)
    this.counter = 0
  }

  getId() {
    return this.state.id.toString()
  }

  getState() {
    return this.state
  }

  increment() {
    this.counter++
  }

  set(prop, value) {
    this[prop] = value
  }

  onLoad() {
    this.loaded = true
  }

  add(a, b) {
    return Number(a) + Number(b)
  }
}
