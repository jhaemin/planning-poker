import { globalStore } from './pages/_app.page'
import { pokerMeAtom, pokerRoomAtom } from './pages/atoms'

declare global {
  interface Window {
    socket: Socket
    globalStore: typeof globalStore
    pokerMeAtom: typeof pokerMeAtom
    pokerRoomAtom: typeof pokerRoomAtom
  }
}

export {}
