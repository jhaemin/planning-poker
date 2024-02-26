import { atom } from 'jotai'
import { Socket } from 'socket.io-client'
import { PokerPlayer, PokerRoom } from './types'

export const connectedSocketAtom = atom<Socket | null>(null)

export const pokerMeAtom = atom<PokerPlayer | null>(null)

export const pokerRoomAtom = atom<PokerRoom | null>(null)
