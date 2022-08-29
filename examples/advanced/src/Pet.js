import { createDurable } from '../../../src' // from 'itty-durable'

export class Pet extends createDurable({ autoReturn: true, autoPersist: true }) {
  constructor(state, env) {
    super(state, env)
    this.humans = []
  }

  setName(name) {
    this.name = name
  }

  add(human) {
    if (!this.humans.includes(human)) {
      this.humans.push(human)

      const { Human } = this.state
      Human.get(human).add(this.name)
    }
  }

  toJSON() {
    return {
      name: this.name,
      humans: this.humans,
    }
  }
}
