import { useAtomValue } from 'jotai'
import { connectedSocketAtom } from '../atoms'

export function useConnectedSocket() {
  const socket = useAtomValue(connectedSocketAtom)

  return socket as NonNullable<typeof socket>
}
