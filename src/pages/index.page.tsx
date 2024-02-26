import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useConnectedSocket } from './hooks/use-connected-socket'
import s from './index.module.scss'

const PlanningPoker = () => {
  const router = useRouter()
  const socket = useConnectedSocket()

  useEffect(() => {
    socket.on('poker:server:created-room', (roomId: string) => {
      router.push(`/${roomId}`)
    })

    return () => {
      socket.off('poker:server:created-room')
    }
  }, [socket, router])

  return (
    <div className={s.container}>
      <h1 className={s.title}>Planning Poker</h1>
      <button
        className={s.createRoom}
        onClick={() => {
          socket.emit('poker:client:create-room')
        }}
      >
        Create a Room
      </button>

      <Link href="/release-notes" className={s.releaseNotes}>
        Release Notes
      </Link>
    </div>
  )
}

export default PlanningPoker
