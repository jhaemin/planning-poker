/**
 * Copied from baemin.dev-server
 */

export type Choice = number | string

export type PokerPlayer = {
  /**
   * Socket ID
   */
  id: string
  /**
   * Randomly generated name or user defined name from the client
   */
  name: string
  roomId: string
  joinedAt: string
  updatedAt: string
  choice: Choice | null | true
}

export type PokerRoomStatus = 'voting' | 'finished'

export type PokerRoom = {
  id: string
  status: PokerRoomStatus
  type: 'sp' | 't'
  players: PokerPlayer[]
  createdAt: string
  updatedAt: string
  createdBy: string
}
