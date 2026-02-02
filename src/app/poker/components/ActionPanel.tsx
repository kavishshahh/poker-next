'use client'
import React, { useState } from 'react'

export default function ActionPanel({ pot, onBet, currentBet = 0, playerChips = 1000 }: any) {
  const [raiseAmount, setRaiseAmount] = useState<number>(10)
  const isCallPhase = currentBet > 0
  const callAmount = Math.max(0, currentBet)
  const minRaise = currentBet + 10

  const handleCall = () => {
    if (callAmount <= playerChips) {
      onBet(callAmount)
    }
  }

  const handleRaise = () => {
    if (raiseAmount > currentBet && raiseAmount <= playerChips) {
      onBet(raiseAmount)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white', background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(22,33,62,0.9) 100%)', padding: '12px 20px', borderRadius: 8, border: '2px solid #00BFFF', boxShadow: '0 0 15px rgba(0, 191, 255, 0.3)' }}>
      {isCallPhase ? (
        <>
          <button
            onClick={handleCall}
            style={{
              padding: '10px 30px',
              background: 'linear-gradient(135deg, #00BFFF 0%, #00FFFF 100%)',
              color: '#000',
              border: 'none',
              borderRadius: 20,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14,
              boxShadow: '0 0 10px rgba(0, 191, 255, 0.6)'
            }}
          >
            💰 Call {callAmount}
          </button>
          
          <label style={{ fontSize: 12, fontWeight: 'bold', marginLeft: 10 }}>Raise:</label>
          <input 
            type="number" 
            value={raiseAmount} 
            onChange={(e) => setRaiseAmount(Number(e.target.value))} 
            style={{ width: 70, padding: '8px 10px', borderRadius: 4, border: 'none', fontSize: 12 }} 
            placeholder={minRaise.toString()}
            min={minRaise}
          />
          <button 
            onClick={handleRaise}
            style={{
              padding: '10px 30px',
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 20,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14,
              boxShadow: '0 0 10px rgba(255, 107, 53, 0.6)'
            }}
          >
            🔼 Raise
          </button>
        </>
      ) : (
        <>
          <label style={{ fontSize: 13, fontWeight: 'bold' }}>Bet:</label>
          <input 
            type="number" 
            value={raiseAmount} 
            onChange={(e) => setRaiseAmount(Number(e.target.value))} 
            style={{ width: 70, padding: '8px 10px', borderRadius: 4, border: 'none', fontSize: 14 }} 
            placeholder="10"
            min="1"
          />
          <button 
            onClick={handleRaise}
            style={{
              padding: '10px 30px',
              background: 'linear-gradient(135deg, #00FF88 0%, #00FFCC 100%)',
              color: '#000',
              border: 'none',
              borderRadius: 20,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14,
              boxShadow: '0 0 10px rgba(0, 255, 136, 0.6)'
            }}
          >
            💵 Bet
          </button>
        </>
      )}
    </div>
  )
}
