'use client'
import { useState, useCallback, useEffect } from 'react'
import { getWebSocketClient } from '../utils/websocket'

type Card = { cardFace: string; suit: string; animationDelay?: number }
type Player = {
  id: string
  name: string
  chips: number
  bet: number
  roundBet?: number
  folded?: boolean
  isActive?: boolean
  hasDealerChip?: boolean
  hand?: Card[]
  avatarURL?: string
}

type GamePhase = 'idle' | 'betting1' | 'flop' | 'betting2' | 'turn' | 'betting3' | 'river' | 'betting4' | 'showdown'

export default function useWebSocketGame() {
  const [state, setState] = useState({
    players: [] as Player[],
    community: [] as Card[],
    pot: 0,
    highBet: 0,
    phase: 'idle' as GamePhase,
    activePlayerIndex: 0,
    minBet: 20,
    actionInProgress: false,
    playerId: '',
    winner: null as any,
    foldWinner: null as any,
  })

  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [gameId, setGameId] = useState('')
  const [error, setError] = useState('')

  // Initialize WebSocket connection
  useEffect(() => {
    const client = getWebSocketClient()
    setConnectionState('connecting')

    // Connect to server
    client.connect().then(() => {
      setConnectionState('connected')
      setError('')
    }).catch((e) => {
      setConnectionState('error')
      setError(`Connection failed: ${e.message}`)
    })

    // Listen for game state updates
    const handleGameState = (data: any) => {
      setState((s) => ({
        ...s,
        players: data.payload?.players || [],
        community: data.payload?.community || [],
        pot: data.payload?.pot || 0,
        highBet: data.payload?.highBet || 0,
        phase: data.payload?.phase || 'idle',
        activePlayerIndex: data.payload?.activePlayerIndex || 0,
        actionInProgress: data.payload?.actionInProgress || false,
        winner: data.payload?.winner || null,
        foldWinner: data.payload?.foldWinner || null,
      }))
    }

    const handleGameCreated = (data: any) => {
      console.log('Game created event received:', data)
      setGameId(data.payload?.gameId || '')
      setState((s) => ({ ...s, playerId: data.payload?.playerId || '' }))
    }

    const handleError = (data: any) => {
      setError(data.payload?.message || data.message || 'Game error occurred')
    }

    const handleConnected = () => {
      setConnectionState('connected')
      setError('')
    }

    const handleDisconnected = () => {
      setConnectionState('disconnected')
    }

    const handleConnectionFailed = () => {
      setConnectionState('error')
      setError('Failed to connect to server')
    }

    client.on('gameState', handleGameState)
    client.on('gameCreated', handleGameCreated)
    client.on('error', handleError)
    client.on('connected', handleConnected)
    client.on('disconnected', handleDisconnected)
    client.on('connection-failed', handleConnectionFailed)

    return () => {
      client.off('gameState', handleGameState)
      client.off('gameCreated', handleGameCreated)
      client.off('error', handleError)
      client.off('connected', handleConnected)
      client.off('disconnected', handleDisconnected)
      client.off('connection-failed', handleConnectionFailed)
    }
  }, [])

  const createLocalGame = useCallback(() => {
    const client = getWebSocketClient()
    client.send('createGame', {
      playerName: 'Player',
      gameType: 'local',
    })
  }, [])

  const createOnlineGame = useCallback((playerName: string) => {
    const client = getWebSocketClient()
    client.send('createGame', {
      playerName,
      gameType: 'online',
    })
  }, [])

  const joinGame = useCallback((gId: string, playerName: string) => {
    const client = getWebSocketClient()
    client.send('joinGame', {
      gameId: gId,
      playerName,
    })
  }, [])

  const fold = useCallback(() => {
    const client = getWebSocketClient()
    if (!gameId) {
      setError('No active game')
      return
    }
    client.send('action', {
      gameId,
      playerId: state.playerId,
      action: 'fold',
    })
  }, [gameId, state.playerId])

  const check = useCallback(() => {
    const client = getWebSocketClient()
    if (!gameId) {
      setError('No active game')
      return
    }
    client.send('action', {
      gameId,
      playerId: state.playerId,
      action: 'check',
    })
  }, [gameId, state.playerId])

  const bet = useCallback((amount: number) => {
    const client = getWebSocketClient()
    if (!gameId) {
      setError('No active game')
      return
    }
    client.send('action', {
      gameId,
      playerId: state.playerId,
      action: 'bet',
      amount,
    })
  }, [gameId, state.playerId])

  const startGame = useCallback(() => {
    const client = getWebSocketClient()
    if (!gameId) {
      setError('No active game')
      return
    }
    client.send('startGame', {
      gameId,
      playerId: state.playerId,
    })
  }, [gameId, state.playerId])

  const nextRound = useCallback(() => {
    const client = getWebSocketClient()
    if (!gameId) {
      setError('No active game')
      return
    }
    client.send('action', {
      gameId,
      action: 'nextRound',
    })
  }, [gameId])

  const reset = useCallback(() => {
    setGameId('')
    setState({
      players: [],
      community: [],
      pot: 0,
      highBet: 0,
      phase: 'idle',
      activePlayerIndex: 0,
      minBet: 20,
      actionInProgress: false,
      playerId: '',
      winner: null,
      foldWinner: null,
    })
    setError('')
  }, [])

  return {
    state,
    connectionState,
    gameId,
    error,
    actions: {
      reset,
      createLocalGame,
      createOnlineGame,
      joinGame,
      fold,
      check,
      bet,
      startGame,
      nextRound,
    },
  }
}
