import { globalStore } from '@/store'
import { useAtomValue } from 'jotai'
import { useRouter } from 'next/router'
import { ReactNode, useEffect } from 'react'
import { io } from 'socket.io-client'
import s from './SocketProvider.module.scss'
import { connectedSocketAtom } from './atoms'

export function SocketProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const connectedSocket = useAtomValue(connectedSocketAtom)

  useEffect(() => {
    const socketHost =
      process.env.NODE_ENV === 'production'
        ? 'https://api.baemin.dev'
        : 'http://localhost:4111'

    const socket = io(socketHost, {
      query: {
        socketFor: 'planningPoker',
      },
    })

    socket.on('connect', () => {
      globalStore.set(connectedSocketAtom, socket)
    })

    socket.on('poker:server:error', (error) => {
      alert(error.message)

      if (error.code === 'ROOM_NOT_FOUND') {
        router.replace('/')
      }
    })

    return () => {
      socket.off('connect')
      socket.off('poker:server:error')

      socket.disconnect()
      globalStore.set(connectedSocketAtom, null)
    }
  }, [router])

  if (!connectedSocket) {
    return <div className={s.loading}>Loading...</div>
  }

  return <>{children}</>
}
