import { Chance } from 'chance'
import dayjs from 'dayjs'
import { Server, Socket } from 'socket.io'
import { REDIS_POKER_KEY_PREFIX } from './constants'
import { rng } from './random-name-generator'
import { redis } from './redis'
import { Choice, PokerPlayer, PokerRoom } from './types'

const chance = new Chance()

function roomKey(roomId: string) {
  return `${REDIS_POKER_KEY_PREFIX}:room:${roomId}`
}

export async function getRoom(roomId: string) {
  const roomStr = await redis.get(roomKey(roomId))

  if (!roomStr) return null

  return JSON.parse(roomStr) as PokerRoom
}

export async function updateRoomInMemory(room: PokerRoom) {
  await redis.set(roomKey(room.id), JSON.stringify(room))
}

export async function createRoom({ socket }: { socket: Socket }) {
  const roomId = `${chance.word({
    length: 5,
  })}-${chance.word({
    length: 5,
  })}`

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const room: PokerRoom = {
    id: roomId,
    type: 'sp',
    status: 'voting',
    players: [],
    createdBy: socket.id,
    createdAt: now,
    updatedAt: now,
  }

  await redis.set(roomKey(roomId), JSON.stringify(room))

  socket.emit('poker:server:created-room', room.id)

  return room
}

export async function joinRoom({
  io,
  socket,
  roomId,
  name,
}: {
  io: Server
  socket: Socket
  roomId: string
  name?: string | null
}) {
  const room = await getRoom(roomId)

  if (!room) {
    socket.emit('poker:server:error', {
      code: 'ROOM_NOT_FOUND',
      message: 'Room not found',
    })
    return
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const player: PokerPlayer = {
    id: socket.id,
    name: name ?? rng(),
    roomId,
    joinedAt: now,
    updatedAt: now,
    choice: null,
  }

  // Set socket data
  socket.data.roomId = roomId

  // Only add player if not already in the room
  if (!room.players.find((player) => player.id === socket.id)) {
    room.players.push(player)
  }

  room.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')

  await updateRoomInMemory(room)

  socket.join(roomKey(roomId))

  socket.emit('poker:server:joined-room')

  await emitPlayerUpdate({ socket, player })
  await broadcastRoomUpdate({ io, room })
}

export async function leaveRoom({
  io,
  socket,
}: {
  io: Server
  socket: Socket
}) {
  const roomId = socket.data.roomId

  if (!roomId) return

  const room = await getRoom(roomId)

  delete socket.data.roomId

  socket.leave(roomKey(roomId))

  if (room) {
    room.players = (room.players ?? []).filter(
      ({ id: playerID }: { id: string }) => playerID !== socket.id
    )
    room.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')

    updateRoomInMemory(room)

    await broadcastRoomUpdate({ io, room })
  }
}

export async function changeName({
  io,
  socket,
  name,
}: {
  io: Server
  socket: Socket
  name: string
}) {
  const roomId = socket.data.roomId

  if (!roomId) return

  const room = await getRoom(roomId)

  if (!room) return

  const playerIndex = room.players.findIndex(({ id }) => id === socket.id)

  if (playerIndex === -1) return

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  room.players[playerIndex].name = name
  room.players[playerIndex].updatedAt = now
  room.updatedAt = now

  await updateRoomInMemory(room)

  await emitPlayerUpdate({ socket, player: room.players[playerIndex] })
  await broadcastRoomUpdate({ io, room })
}

export async function vote({
  io,
  socket,
  choice,
}: {
  io: Server
  socket: Socket
  choice: Choice
}) {
  const roomId = socket.data.roomId

  if (!roomId) return

  const room = await getRoom(roomId)

  if (!room) return

  if (room.status !== 'voting') return

  const playerIndex = room.players.findIndex(({ id }) => id === socket.id)

  if (playerIndex === -1) return

  if (room.players[playerIndex].choice === choice) {
    room.players[playerIndex].choice = null
  } else {
    room.players[playerIndex].choice = choice
  }

  await updateRoomInMemory(room)

  await emitPlayerUpdate({ socket, player: room.players[playerIndex] })
  await broadcastRoomUpdate({ io, room })
}

export async function stopVote({ io, socket }: { io: Server; socket: Socket }) {
  const roomId = socket.data.roomId

  if (!roomId) return

  const room = await getRoom(roomId)

  if (!room) return

  if (room.status !== 'voting') return

  room.status = 'finished'

  await updateRoomInMemory(room)
  await broadcastRoomUpdate({ io, room })
}

export async function restartVote({
  io,
  socket,
}: {
  io: Server
  socket: Socket
}) {
  const roomId = socket.data.roomId

  if (!roomId) return

  const room = await getRoom(roomId)

  if (!room) return

  const playerIndex = room.players.findIndex(({ id }) => id === socket.id)

  if (playerIndex === -1) return

  room.status = 'voting'
  room.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')

  room.players = room.players.map((player) => ({
    ...player,
    choice: null,
  }))

  await updateRoomInMemory(room)
  await broadcastRoomUpdate({ io, room })
  await emitPlayerUpdate({ socket, player: room.players[playerIndex] })
}

/**
 * Change the room type
 *
 * Reset the players choices and initialize the room status
 */
export async function changeRoomType({
  io,
  socket,
  type,
}: {
  io: Server
  socket: Socket
  type: PokerRoom['type']
}) {
  const roomId = socket.data.roomId

  if (!roomId) return

  const room = await getRoom(roomId)

  if (!room) return

  if (room.type === type) return

  const playerIndex = room.players.findIndex(({ id }) => id === socket.id)

  if (playerIndex === -1) return

  room.type = type
  room.status = 'voting'

  room.players = room.players.map((player) => ({
    ...player,
    choice: null,
  }))

  await updateRoomInMemory(room)
  await broadcastRoomUpdate({ io, room })
  await emitPlayerUpdate({ socket, player: room.players[playerIndex] })
}

export async function broadcastRoomUpdate({
  io,
  room,
}: {
  io: Server
  room: PokerRoom
}) {
  // When the room is in voting status, hide the choices
  if (room.status === 'voting') {
    room.players = room.players.map((player) => ({
      ...player,
      choice: player.choice !== null ? true : null,
    }))
  }

  io.to(roomKey(room.id)).emit('poker:server:updated-room', room)
}

export async function emitPlayerUpdate({
  socket,
  player,
}: {
  socket: Socket
  player: PokerPlayer
}) {
  socket.emit('poker:server:updated-me', player)
}
