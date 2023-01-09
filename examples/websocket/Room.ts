import { createDurable } from 'itty-durable'

export class Room extends createDurable({ autoPersist: true }) {
  sockets: any[]

  constructor(state, env) {
    super(state, env)

    this.sockets = []
  }

  // CREATE NEW SOCKET
  connect() {
    const { sockets } = this
    const id = Math.random() // just a random id
    const [client, server] = Object.values(new WebSocketPair())

    server.accept() // immediately accept connection

    // if a client closes the connection, close it immediately
    server.addEventListener('close', () => {
      server.close()
      this.sockets = this.sockets.filter(s => s.id !== id)
    })

    // add socket.server to list of open sockets
    sockets.push({ id, server })

    // send a message to all connected sockets
    this.sendMessage('A new connection has been established!')

    return new Response(null, { status: 101, webSocket: client })
  }

  sendMessage(message: string) {
    // send a message to all open sockets
    for (const socket of this.sockets) {
      socket.send(message)
    }
  }
}
