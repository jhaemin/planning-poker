import cors from 'cors'
import { Cron } from 'croner'
import dayjs from 'dayjs'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { REDIS_POKER_KEY_PREFIX } from './constants'
import {
  changeName,
  changeRoomType,
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  restartVote,
  stopVote,
  vote,
} from './functions'
import { redis } from './redis'
import { Choice, PokerRoom } from './types'

const isProduction = process.env.NODE_ENV === 'production'

function deleteAllPlanningPokerKeys() {
  const stream = redis.scanStream({
    match: `${REDIS_POKER_KEY_PREFIX}:*`,
  })

  const pipeline = redis.pipeline()

  stream.on('data', (keys: string[]) => {
    keys.forEach((key) => {
      pipeline.del(key)
    })
  })

  stream.on('end', () => {
    pipeline.exec()
  })
}

const app = express()
const server = createServer(app)
const options = {
  cors: {
    origin: isProduction
      ? 'https://pp.land'
      : ['http://localhost:3000', 'http://localhost:4110'],
  },
} as any
const io = new Server(server, options)

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  })
)

app.get('/', (req, res) => {
  res.send('api.pp.land')
})

io.on('connection', (socket) => {
  const socketFor = socket.handshake.query.socketFor

  socket.on('disconnect', async () => {
    if (socketFor === 'planningPoker') {
      await leaveRoom({ io, socket })
    }
  })

  socket.on('poker:client:create-room', async () => {
    await createRoom({ socket })
  })

  socket.on(
    'poker:client:join-room',
    async ({ roomId, name }: { roomId: string; name?: string | null }) => {
      await joinRoom({ io, socket, roomId, name })
    }
  )

  socket.on('poker:client:leave-room', async () => {
    await leaveRoom({ io, socket })
  })

  socket.on(
    'poker:client:change-room-type',
    async (type: PokerRoom['type']) => {
      await changeRoomType({ io, socket, type })
    }
  )

  socket.on('poker:client:change-name', async (name: string) => {
    await changeName({ io, socket, name })
  })

  socket.on('poker:client:stop-vote', async () => {
    await stopVote({ io, socket })
  })

  socket.on('poker:client:restart-vote', async () => {
    await restartVote({ io, socket })
  })

  socket.on('poker:client:vote', async (choice: Choice) => {
    await vote({ io, socket, choice })
  })
})

server.listen(isProduction ? 12347 : 4111)

/**
 * Cron job:
 * Run every 30 minutes
 */
Cron('*/30 * * * *', async () => {
  console.log('Cron job started', dayjs().format('YYYY-MM-DD HH:mm:ss'))

  const roomStream = redis.scanStream({
    match: `${REDIS_POKER_KEY_PREFIX}:room:*`,
  })
  const playerStream = redis.scanStream({
    match: `${REDIS_POKER_KEY_PREFIX}:player:*`,
  })

  const pipeline = redis.pipeline()

  roomStream.on('data', async (keys: string[]) => {
    keys.forEach(async (key) => {
      const room = await getRoom(
        key.replace(`${REDIS_POKER_KEY_PREFIX}:room:`, '')
      )

      if (!room) return

      if (dayjs().diff(dayjs(room.updatedAt), 'minutes') > 60) {
        console.log('Cron job: delete room', room.id)

        pipeline.del(key)
      }
    })
  })

  roomStream.on('end', async () => {
    pipeline.exec()
  })

  playerStream.on('data', async (keys: string[]) => {
    keys.forEach(async (key) => {
      pipeline.del(key)
    })
  })

  playerStream.on('end', async () => {
    pipeline.exec()
  })
})
