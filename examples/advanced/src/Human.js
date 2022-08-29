import { createDurable } from '../../../src' // from 'itty-durable'

export class Human extends createDurable({ autoReturn: true, autoPersist: true }) {
  constructor(state, env) {
    super(state, env)
    this.pets = []
  }

  setName(name) {
    this.name = name
  }

  add(pet) {
    if (!this.pets.includes(pet)) {
      this.pets.push(pet)

      const { Pet } = this.state
      Pet.get(pet).add(this.name)
    }
  }

  toJSON() {
    return {
      name: this.name,
      pets: this.pets,
    }
  }
}
