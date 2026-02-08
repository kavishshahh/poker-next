'use client'
import React from 'react'
import Card from './Card'
import HiddenCard from './HiddenCard'
import { PlayerName } from './PlayerName'

export default function PlayerSeat({ player, position = 0, currentPlayerId, phase }: any) {
  if (!player) return null

  const chipCountImageURL = '/old-assets/chips.svg'
  const playerBetImageURL = '/old-assets/bet.svg'
  const dealerChipImageURL = '/old-assets/chip.svg'
  const avatarURL = player.avatarURL || '/old-assets/boy.svg'

  // Use wallet address for Basename lookup if available
  const walletAddress = player.walletAddress as `0x${string}` | undefined

  return (
    <div className={`player-entity--wrapper p${position}`}>
      <div className="player-entity--container">
        <div className="player-avatar--container">
          <img className={`player-avatar--image${player.isActive ? ' activePlayer' : ''}`} src={avatarURL} alt="Player Avatar" />
          <h5 className="player-info--name">
            {walletAddress ? (
              <PlayerName address={walletAddress} />
            ) : (
              player.name
            )}
          </h5>
          <div className="player-info--stash--container">
            <img className="player-info--stash--image" src={chipCountImageURL} alt="Player Stash" />
            <h5 style={{ margin: 0 }}>{player.chips ?? player.stack}</h5>
          </div>
          <div className="player-info--bet--container">
            <img className="player-info--bet--image" src={playerBetImageURL} alt="Player Bet" />
            <h5 style={{ margin: 0 }}>{`Bet: ${player.bet ?? 0}`}</h5>
          </div>
          {player.hasDealerChip ? (
            <div className="dealer-chip-icon-container">
              <img src={dealerChipImageURL} alt="Dealer Chip" />
            </div>
          ) : null}
        </div>
      </div>
      <div className='centered-flex-row abscard'>
        {(player.cards || player.hand || []).map((c: any, i: number) => (
          player.id === currentPlayerId ? (
            <Card key={i} cardData={c} applyFoldedClassname={player.folded} isShowdownCard={phase === 'showdown'} />
          ) : (
            <HiddenCard key={i} cardData={c} applyFoldedClassname={player.folded} isShowdownCard={phase === 'showdown'} />
          )
        ))}
      </div>
    </div>
  )
}

