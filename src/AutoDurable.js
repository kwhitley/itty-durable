import { createIttyDurable } from 'itty-durable'

// exports a Durable Object with auto features turned on
export const AutoDurable = createIttyDurable({
  autoPersist: true,
  autoReturnThis: true,
})
