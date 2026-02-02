'use client'
import React from 'react'
import PlayerSeat from './PlayerSeat'

export default function Table({ state, actions }: any) {
  const players = state.players || []

  // Reorder players so current player is always at position 0 (bottom center)
  // and opponent at position 1 (bottom left)
  const orderedPlayers = []
  if (players.length > 0) {
    const currentPlayerIndex = players.findIndex((p: any) => p.id === state.playerId)
    
    if (currentPlayerIndex === -1) {
      // If current player not found, use original order
      orderedPlayers.push(players[0])
      orderedPlayers.push(players[1])
    } else {
      // Put current player first (position 0 - bottom center)
      orderedPlayers.push(players[currentPlayerIndex])
      // Put opponent second (position 1 - bottom left)
      const opponentIndex = currentPlayerIndex === 0 ? 1 : 0
      if (players[opponentIndex]) {
        orderedPlayers.push(players[opponentIndex])
      }
    }
  }

  return (
    <section className="poker-app--background">
      <div className="poker-table--container">
        <img className="poker-table--table-image" src={'/old-assets/table-nobg-svg-01.svg'} alt="Poker Table" />

        {/* Render players in order: current player at position 0 (bottom center), opponent at position 1 (bottom left) */}
        {orderedPlayers[0] ? <PlayerSeat key={orderedPlayers[0].id} player={orderedPlayers[0]} position={0} /> : null}
        {orderedPlayers[1] ? <PlayerSeat key={orderedPlayers[1].id} player={orderedPlayers[1]} position={1} /> : null}
      </div>
    </section>
  )
}
