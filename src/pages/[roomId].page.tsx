import { globalStore } from '@/store'
import clsx from 'clsx'
import {
  ArrowCounterclockwise,
  House,
  Macwindow,
  Stop,
  Tag,
} from 'framework7-icons-plus/react'
import { useAtom } from 'jotai'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { Flipped, Flipper } from 'react-flip-toolkit'
import { Cards } from './Cards'
import { pokerMeAtom, pokerRoomAtom } from './atoms'
import { useConnectedSocket } from './hooks/use-connected-socket'
import { HashIcon, TShirtIcon } from './icons'
import s from './room.module.scss'
import { PokerPlayer, PokerRoom } from './types'

const PlanningPokerRoom = () => {
  const router = useRouter()
  const roomId = router.query.roomId
  const socket = useConnectedSocket()

  const [hasJoined, setHasJoined] = useState(false)
  const [me, setMe] = useAtom(pokerMeAtom)
  const [room, setRoom] = useAtom(pokerRoomAtom)

  const [isSeparated, setIsSeparated] = useState(false)

  const separateWindowRef = useRef<Window | null>(null)

  useEffect(() => {
    if (!roomId) {
      return
    }

    socket.on('poker:server:joined-room', () => {
      setHasJoined(true)
    })

    socket.on('poker:server:updated-room', (room: PokerRoom) => {
      setRoom(room)

      // Update my information when the room is updated by other players.
      // But only if the choice is not a boolean (true/false).

      const playerMe = room.players.find(({ id }) => id === socket.id)

      if (playerMe && typeof playerMe.choice !== 'boolean') {
        setMe(playerMe)
      }
    })

    // My choice is included
    socket.on('poker:server:updated-me', (me: PokerPlayer) => {
      setMe(me)
    })

    const name = window.localStorage.getItem('poker-name')

    socket.emit('poker:client:join-room', {
      roomId,
      name,
    })

    return () => {
      socket.emit('poker:client:leave-room', roomId)

      socket.off('poker:server:joined-room')
      socket.off('poker:server:updated-room')
      socket.off('poker:server:updated-me')
    }
  }, [roomId, socket, router, setMe, setRoom])

  useEffect(() => {
    window.onbeforeunload = () => {
      separateWindowRef.current?.close()
    }

    return () => {
      if (separateWindowRef.current) {
        separateWindowRef.current.close()
      }
    }
  }, [])

  if (typeof roomId !== 'string') {
    return <div>Invalid room ID</div>
  }

  if (!hasJoined) {
    // Joining room...
    return <div></div>
  }

  if (!me || !room) {
    return null
  }

  return (
    <div className={s.container}>
      <div className={s.board}>
        <div>
          <Flipper
            flipKey={room.players.map(({ id }) => id)}
            className={s.players}
          >
            {room.players.map((player) => (
              <Flipped key={player.id} flipId={player.id}>
                <div
                  className={clsx(s.player, {
                    [s.voted]: player.choice,
                    [s.me]: player.id === me.id,
                  })}
                >
                  <span className={s.name}>{player.name}</span>
                  {room.status === 'finished' && player.choice && (
                    <span className={s.choice}>{player.choice}</span>
                  )}
                </div>
              </Flipped>
            ))}
          </Flipper>
        </div>

        <div className={s.actions}>
          <Link href="/" className={s.action}>
            <House />
            Home
          </Link>
          <button
            className={s.action}
            onClick={() => {
              const name = prompt('What is your name? (max 10)')
                ?.trim()
                .slice(0, 10)

              if (!name) {
                return
              }

              window.localStorage.setItem('poker-name', name)

              socket.emit('poker:client:change-name', name)
            }}
          >
            <Tag />
            Rename
          </button>
          {room.status === 'voting' ? (
            <button
              className={s.action}
              onClick={() => {
                socket.emit('poker:client:stop-vote', roomId)
              }}
            >
              <Stop />
              Stop
            </button>
          ) : (
            <button
              className={s.action}
              onClick={() => {
                socket.emit('poker:client:restart-vote', roomId)
              }}
            >
              <ArrowCounterclockwise />
              Restart
            </button>
          )}
          <div className={s.types}>
            <button
              className={clsx(s.type, {
                [s.active]: room.type === 'sp',
              })}
              onClick={() => {
                socket.emit('poker:client:change-room-type', 'sp')
              }}
            >
              <HashIcon />
            </button>
            <button
              className={clsx(s.type, {
                [s.active]: room.type === 't',
              })}
              onClick={() => {
                socket.emit('poker:client:change-room-type', 't')
              }}
            >
              <TShirtIcon />
            </button>
          </div>
        </div>

        {isSeparated ? (
          <div
            className={s.separatedInfo}
            onClick={() => {
              separateWindowRef.current?.close()
            }}
          >
            Cards window is separated
            <br />
            You can click here to close
          </div>
        ) : (
          <>
            <Cards
              socket={socket}
              globalStore={globalStore}
              pokerMeAtom={pokerMeAtom}
              pokerRoomAtom={pokerRoomAtom}
            />

            <button
              className={s.separate}
              onClick={() => {
                const cardsWindow = window.open(
                  '/cards',
                  'Planning Poker Cards',
                  'width=700,height=350'
                )

                if (!cardsWindow) {
                  return
                }

                separateWindowRef.current = cardsWindow

                cardsWindow.socket = socket
                cardsWindow.globalStore = globalStore
                cardsWindow.pokerMeAtom = pokerMeAtom
                cardsWindow.pokerRoomAtom = pokerRoomAtom

                cardsWindow.onload = () => {
                  setIsSeparated(true)

                  cardsWindow.onbeforeunload = () => {
                    setIsSeparated(false)
                  }
                }
              }}
            >
              <Macwindow /> Separate cards window
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default PlanningPokerRoom
