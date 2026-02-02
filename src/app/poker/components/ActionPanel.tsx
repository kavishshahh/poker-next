'use client'
import React, { useState } from 'react'

export default function ActionPanel({ pot, onBet }: any) {
  const [bet, setBet] = useState<number>(10)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white', background: 'rgba(0,0,0,0.6)', padding: '12px 20px', borderRadius: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 'bold' }}>Bet:</label>
      <input 
        type="number" 
        value={bet} 
        onChange={(e) => setBet(Number(e.target.value))} 
        style={{ width: 70, padding: '8px 10px', borderRadius: 4, border: 'none', fontSize: 14 }} 
        placeholder="10"
        min="1"
      />
      <button 
        onClick={() => onBet(bet)}
        style={{
          padding: '8px 24px',
          background: '#2adb2a',
          color: 'white',
          border: 'none',
          borderRadius: 20,
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: 14
        }}
      >
        Bet
      </button>
    </div>
  )
}
