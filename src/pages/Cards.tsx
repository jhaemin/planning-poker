import clsx from 'clsx'
import { useAtom } from 'jotai'
import { Socket } from 'socket.io-client'
import s from './Cards.module.scss'
import { PokerPlayer, PokerRoom } from './types'

const storyPoints = ['?', 0.5, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
const tShirts = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']

export function Cards({
  socket,
  globalStore,
  pokerMeAtom,
  pokerRoomAtom,
}: {
  socket: Socket
  globalStore: any
  pokerMeAtom: any
  pokerRoomAtom: any
}) {
  const [me, setMe] = useAtom<PokerPlayer | null>(pokerMeAtom, {
    store: globalStore,
  })
  const [room, setRoom] = useAtom<PokerRoom | null>(pokerRoomAtom, {
    store: globalStore,
  })

  if (!room || !me) {
    return null
  }

  const roomType = room.type ?? 'sp'

  return (
    <div
      className={clsx(s.cards, {
        [s.disabled]: room.status !== 'voting',
        [s.tShirt]: roomType === 't',
      })}
    >
      {(roomType === 'sp' ? storyPoints : tShirts).map((value) => (
        <button
          key={value}
          onClick={() => {
            if (room.status !== 'voting') return

            socket.emit('poker:client:vote', value)
          }}
          className={clsx(s.card, {
            [s.selected]: me.choice === value,
          })}
        >
          {value}
        </button>
      ))}
    </div>
  )
}
