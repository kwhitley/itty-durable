import { Router } from 'itty-router'
import { withDurables } from 'itty-durable'
import { error, json, missing, status, withParams } from 'itty-router-extras'

// export durable object class, per spec
export * from './Room'

const router = Router()

router
  .all('*', withDurables())

  // GENERAL CLIENT-WORKER SOCKET EXAMPLE
  .get('/connect', (request) => {
    const [client, server] = Object.values(new WebSocketPair())

    server.accept()

    // if a client closes the connection, close it immediately
    server.addEventListener('close', () => {
      server.close()
    })

    // test the connection by sending a delayed message after 2 seconds
    setTimeout(() => {
      server.send('delayed message...')
    }, 2000)

    return new Response(null, { status: 101, websocket: client })
  })

  // CLIENT-WORKER-DO SOCKET EXAMPLE
  .get('/room/:id/connect', withParams,
    ({ id, Room }) => Room.get(id).connect()
  )

// CF ES6 module syntax
export default {
  fetch: (request, env, context) => router
                        .handle(request, env, context)
                        .catch((err) => error(err.status || 500, err.message))
}
