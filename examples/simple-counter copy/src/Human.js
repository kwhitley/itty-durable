import { createDurable } from '../../../src' // from 'itty-durable'

export class Human extends createDurable({ autoReturn: true, autoPersist: true }) {
  constructor(state, env) {
    super(state, env)
    this.pets = []
  }

  add(pet) {
    if (!this.pets.includes(pet)) {
      this.pets.push(pet)

      const { Pet } = this.state
      Pet.get(pet).add(this.name)
    }
  }

  toJSON() {
    const { state, ...other } = this

    return {
      name: this.state.name,
      ...other
    }
  }
}
