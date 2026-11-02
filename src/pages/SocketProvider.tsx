import { globalStore } from '@/store'
import { useAtomValue } from 'jotai'
import { useRouter } from 'next/router'
import { ReactNode, useEffect } from 'react'
import { io } from 'socket.io-client'
import { nanoid } from 'nanoid'
import s from './SocketProvider.module.scss'
import { connectedSocketAtom } from './atoms'

const VISITOR_ID_KEY = 'pp:visitor-id'

/**
 * Anonymous, random per-browser id used only to count unique visitors.
 * Storage can be unavailable (private mode, blocked site data); the
 * connection still counts, just not as a unique visitor.
 */
function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY)
    if (!id) {
      id = nanoid()
      localStorage.setItem(VISITOR_ID_KEY, id)
    }
    return id
  } catch {
    return undefined
  }
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const connectedSocket = useAtomValue(connectedSocketAtom)

  useEffect(() => {
    const socketHost =
      process.env.NODE_ENV === 'production'
        ? 'https://api.pp.land'
        : 'http://localhost:4111'

    const socket = io(socketHost, {
      query: {
        socketFor: 'planningPoker',
        visitorId: getVisitorId(),
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
