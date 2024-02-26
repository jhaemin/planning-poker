import { Cards } from './Cards'

export default function CardsCSRWrapper() {
  if (typeof window === 'undefined') {
    return null
  }

  return (
    <Cards
      socket={window.socket}
      globalStore={window.globalStore}
      pokerMeAtom={window.pokerMeAtom}
      pokerRoomAtom={window.pokerRoomAtom}
    />
  )
}
