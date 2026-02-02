'use client'
import React from 'react'

function renderUnicodeSuitSymbol(suit: string) {
  if (!suit) return '?'
  const suitLower = suit.toLowerCase()
  switch (suitLower) {
    case 'heart':
    case 'hearts':
      return '♥'
    case 'diamond':
    case 'diamonds':
      return '♦'
    case 'spade':
    case 'spades':
      return '♠'
    case 'club':
    case 'clubs':
      return '♣'
    default:
      return '?'
  }
}

export default function Card({ cardData, applyFoldedClassname }: any) {
  if (!cardData) return null
  
  // Handle both {rank, suit} and {cardFace, suit} formats
  const rank = cardData.rank || cardData.cardFace
  const suit = cardData.suit
  const animationDelay = cardData.animationDelay || 0
  
  if (!rank || !suit) {
    return <div style={{ padding: 8, minWidth: 36 }}>?</div>
  }
  
  const suitLower = suit.toLowerCase()
  const color = (suitLower === 'diamond' || suitLower === 'diamonds' || suitLower === 'heart' || suitLower === 'hearts') ? 'red' : 'black'
  
  return (
    <div className={`playing-card cardIn ${applyFoldedClassname ? 'folded' : ''}`} style={{ animationDelay: `${applyFoldedClassname ? 0 : animationDelay}ms`, padding: 8, minWidth: 36 }}>
      <h6 style={{ color, margin: 0, fontSize: 12, fontWeight: 'bold' }}>{`${rank}${renderUnicodeSuitSymbol(suit)}`}</h6>
    </div>
  )
}
