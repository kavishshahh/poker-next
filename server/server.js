const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store games: gameId → { gameId, players: [], community, pot, phase, ... }
const games = new Map();

// Store player connections: playerId → { ws, gameId }
const playerConnections = new Map();

console.log('🚀 Starting WebSocket Poker Server...\n');

// ====== CARD UTILITIES ======
function createDeck() {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
  const deck = [];
  
  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  
  return deck.sort(() => Math.random() - 0.5); // Shuffle
}

function dealCards(game) {
  if (!game.deck) {
    game.deck = createDeck();
  }
  
  // Deal 2 cards to each player
  game.players.forEach((player) => {
    player.hand = [game.deck.pop(), game.deck.pop()];
  });
  
  console.log(`   💳 Cards dealt to ${game.players.length} players`);
}

function dealCommunityCards(game, count) {
  if (!game.deck) {
    game.deck = createDeck();
  }
  
  for (let i = 0; i < count; i++) {
    game.community.push(game.deck.pop());
  }
  
  console.log(`   💳 ${count} community card(s) dealt. Total: ${game.community.length}`);
}

function getCardValue(rank) {
  const values = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };
  return values[rank];
}

function evaluateHand(hand, community) {
  const allCards = [...hand, ...community];
  
  // Count occurrences of each rank
  const rankCounts = {};
  allCards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  
  // Count occurrences of each suit
  const suitCounts = {};
  allCards.forEach(card => {
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
  });
  
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const values = allCards.map(card => getCardValue(card.rank)).sort((a, b) => b - a);
  
  // Check for flush
  const isFlush = Object.values(suitCounts).some(count => count >= 5);
  
  // Check for straight
  const uniqueValues = [...new Set(values)];
  let isStraight = false;
  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
      isStraight = true;
      break;
    }
  }
  // Check for A-2-3-4-5 (wheel)
  if (!isStraight && uniqueValues.includes(14) && uniqueValues.includes(2) && uniqueValues.includes(3) && uniqueValues.includes(4) && uniqueValues.includes(5)) {
    isStraight = true;
  }
  
  let handType = 'High Card';
  let score = values[0];
  
  if (counts[0] === 4) {
    handType = 'Four of a Kind';
    score = 800000 + values[0];
  } else if (counts[0] === 3 && counts[1] === 2) {
    handType = 'Full House';
    score = 700000 + values[0];
  } else if (isFlush) {
    handType = 'Flush';
    score = 600000 + values[0];
  } else if (isStraight) {
    handType = 'Straight';
    score = 500000 + values[0];
  } else if (counts[0] === 3) {
    handType = 'Three of a Kind';
    score = 400000 + values[0];
  } else if (counts[0] === 2 && counts[1] === 2) {
    handType = 'Two Pair';
    score = 300000 + values[0];
  } else if (counts[0] === 2) {
    handType = 'Pair';
    score = 200000 + values[0];
  } else {
    handType = 'High Card';
    score = 100000 + values[0];
  }
  
  return { score, handType };
}

function determineWinner(players, community) {
  const activePlayers = players.filter(p => !p.folded);
  
  if (activePlayers.length === 1) {
    return activePlayers[0];
  }
  
  let winner = activePlayers[0];
  let bestEval = evaluateHand(winner.hand, community);
  
  for (let i = 1; i < activePlayers.length; i++) {
    const handEval = evaluateHand(activePlayers[i].hand, community);
    if (handEval.score > bestEval.score) {
      bestEval = handEval;
      winner = activePlayers[i];
    }
  }
  
  // Store hand type on the winner object
  winner.handType = bestEval.handType;
  return winner;
}

function allBetsMatched(game) {
  const activePlayers = game.players.filter(p => !p.folded && p.isActive);
  
  if (activePlayers.length <= 1) return true;
  
  // For betting to be complete:
  // 1. All players who have chips remaining must have acted
  // 2. All remaining-chip players have matching bets
  // 3. OR all players are all-in (can't act anymore)
  
  const playersWithChips = activePlayers.filter(p => p.chips > 0);
  const allAllIn = playersWithChips.length === 0; // Everyone is all-in
  
  if (allAllIn) return true; // All players are all-in, no more betting possible
  
  // Players with chips remaining must have all acted
  const playersWithChipsActed = playersWithChips.every(p => p.actedThisRound);
  
  // Their bets must match
  const betsMatch = playersWithChips.every(p => p.roundBet === playersWithChips[0].roundBet);
  
  return playersWithChipsActed && betsMatch;
}

function advancePhase(game) {
  const phases = ['betting1', 'flop', 'betting2', 'turn', 'betting3', 'river', 'betting4', 'showdown'];
  const currentIndex = phases.indexOf(game.phase);
  
  console.log(`   🔄 Advancing from phase: ${game.phase} (index ${currentIndex})`);
  
  if (currentIndex === -1) return;
  
  // Check if all active players are all-in
  const activePlayers = game.players.filter(p => !p.folded && p.isActive);
  const allAllIn = activePlayers.every(p => p.chips === 0);
  
  let nextIndex = currentIndex + 1;
  
  // If all players are all-in, skip remaining betting rounds and go straight to showdown
  if (allAllIn) {
    // Complete all remaining community cards if needed
    if (game.community.length < 5) {
      dealCommunityCards(game, 5 - game.community.length);
    }
    game.phase = 'showdown';
    
    // Determine winner
    const activePlayers = game.players.filter(p => !p.folded);
    let winner;
    let winReason = '';
    
    if (activePlayers.length === 1) {
      winner = activePlayers[0];
      winReason = 'Everyone else folded';
    } else {
      winner = determineWinner(game.players, game.community);
      winReason = 'Best hand';
    }

    if (winner) {
      winner.chips += game.pot;
      console.log(`   🏆 Winner: ${winner.name} wins ${game.pot} chips! (${winReason})`);
      
      // Evaluate both players' hands for display
      const playerHandEvals = game.players
        .filter(p => !p.folded)
        .map(p => ({
          id: p.id,
          name: p.name,
          hand: p.hand,
          ...evaluateHand(p.hand, game.community)
        }));
      
      game.winner = {
        id: winner.id,
        name: winner.name,
        chips: winner.chips,
        potWon: game.pot,
        reason: winReason,
        hand: winner.hand,
        handType: winner.handType || 'High Card',
        allHands: playerHandEvals
      };
    }
    return;
  }
  
  if (nextIndex >= phases.length) {
    game.phase = 'showdown';
    return;
  }
  
  game.phase = phases[nextIndex];
  console.log(`   ➡️  Advanced to phase: ${game.phase} (index ${nextIndex})`);
  
  // Reset bets AFTER advancing, before dealing new cards
  // This ensures the action state is clean for the next betting round
  if (game.phase.startsWith('betting')) {
    console.log(`   🔄 Resetting betting state for ${game.phase}`);
    game.players.forEach(p => {
      p.roundBet = 0;
      p.actedThisRound = false;
    });
    game.highBet = 0;
    // For heads-up: alternate button every 2 betting rounds
    // betting1 & betting2 → Player 0 (Kavish) goes first
    // betting3 & betting4 → Player 1 (Player) goes first
    const bettingPhases = ['betting1', 'betting2', 'betting3', 'betting4'];
    const bettingIndex = bettingPhases.indexOf(game.phase);
    game.activePlayerIndex = Math.floor(bettingIndex / 2) % 2;
    console.log(`   👤 Active player set to: ${game.players[game.activePlayerIndex]?.name} (index ${game.activePlayerIndex})`);
  }
  
  // Deal community cards on appropriate phases
  if (game.phase === 'flop') {
    dealCommunityCards(game, 3);
    // Immediately advance to betting2 after dealing flop
    game.phase = 'betting2';
    game.players.forEach(p => {
      p.roundBet = 0;
      p.actedThisRound = false;
    });
    game.highBet = 0;
    // Keep consistent: player 0 always acts first
    game.activePlayerIndex = 0;
    console.log(`   ➡️  Auto-advanced to betting2 after flop`);
    console.log(`   👤 Active player set to: ${game.players[game.activePlayerIndex]?.name} (index ${game.activePlayerIndex})`);
  } else if (game.phase === 'turn') {
    dealCommunityCards(game, 1);
    // Immediately advance to betting3 after dealing turn
    game.phase = 'betting3';
    game.players.forEach(p => {
      p.roundBet = 0;
      p.actedThisRound = false;
    });
    game.highBet = 0;
    // Keep consistent: player 0 always acts first
    game.activePlayerIndex = 0;
    console.log(`   ➡️  Auto-advanced to betting3 after turn`);
    console.log(`   👤 Active player set to: ${game.players[game.activePlayerIndex]?.name} (index ${game.activePlayerIndex})`);
  } else if (game.phase === 'river') {
    dealCommunityCards(game, 1);
    // Immediately advance to betting4 after dealing river
    game.phase = 'betting4';
    game.players.forEach(p => {
      p.roundBet = 0;
      p.actedThisRound = false;
    });
    game.highBet = 0;
    // Keep consistent: player 0 always acts first
    game.activePlayerIndex = 0;
    console.log(`   ➡️  Auto-advanced to betting4 after river`);
    console.log(`   👤 Active player set to: ${game.players[game.activePlayerIndex]?.name} (index ${game.activePlayerIndex})`);
  } else if (game.phase === 'showdown') {
    // Determine winner
    const activePlayers = game.players.filter(p => !p.folded);
    let winner;
    let winReason = '';
    
    if (activePlayers.length === 1) {
      winner = activePlayers[0];
      winReason = 'Everyone else folded';
    } else {
      winner = determineWinner(game.players, game.community);
      winReason = 'Best hand';
    }
    
    winner.chips += game.pot;
    
    // Evaluate both players' hands for display
    const playerHandEvals = game.players
      .filter(p => !p.folded)
      .map(p => ({
        id: p.id,
        name: p.name,
        hand: p.hand,
        ...evaluateHand(p.hand, game.community)
      }));
    
    game.winner = {
      id: winner.id,
      name: winner.name,
      chips: winner.chips,
      potWon: game.pot,
      reason: winReason,
      hand: winner.hand,
      handType: winner.handType || 'High Card',
      allHands: playerHandEvals  // Include all player hands for display
    };
    
    console.log(`   🏆 Winner: ${winner.name} wins ${game.pot} chips! (${winReason})`);
  }
}

wss.on('connection', (ws) => {
  console.log('✅ New client connected\n');

  ws.on('message', (data) => {
    try {
      console.log('\n🔍 Raw data received:', data);
      const message = JSON.parse(data);
      console.log('📨 Message received:', message.type);
      console.log('   Message object keys:', Object.keys(message));
      console.log('   Payload:', message.payload ? JSON.stringify(message.payload) : 'UNDEFINED ❌');

      // Validate payload exists
      if (!message.payload) {
        console.error('❌ Error: Payload is undefined for message type:', message.type);
        console.log('   Full message:', JSON.stringify(message));
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Missing payload in request' }
        }));
        return;
      }

      if (message.type === 'createGame') {
        // CREATE NEW GAME
        const { playerName, gameType } = message.payload;
        const gameId = uuidv4();
        const playerId = uuidv4();

        const newGame = {
          gameId,
          gameType,
          players: [
            {
              id: playerId,
              name: playerName,
              chips: 1000,
              bet: 0,
              roundBet: 0,
              hand: [],
              folded: false,
              isActive: true,
              hasDealerChip: true,
            },
          ],
          community: [],
          pot: 0,
          highBet: 0,
          phase: 'idle',
          activePlayerIndex: 0,
          minBet: 20,
          deck: null,
        };

        games.set(gameId, newGame);
        playerConnections.set(playerId, { ws, gameId });

        console.log(`   ✅ Game created: ${gameId}`);
        console.log(`   ✅ Player added: ${playerName} (${playerId})`);
        console.log(`   ✅ Players in game: 1\n`);

        // Send response to Brave
        ws.send(
          JSON.stringify({
            type: 'gameCreated',
            payload: { gameId, playerId },
          })
        );
      } 
      else if (message.type === 'joinGame') {
        // JOIN EXISTING GAME
        const { gameId, playerName } = message.payload;
        const game = games.get(gameId);

        if (!game) {
          console.log(`   ❌ Game not found: ${gameId}\n`);
          ws.send(
            JSON.stringify({
              type: 'error',
              payload: { message: 'Game not found' },
            })
          );
          return;
        }

        if (game.players.length >= 2) {
          console.log(`   ❌ Game is full: ${gameId}\n`);
          ws.send(
            JSON.stringify({
              type: 'error',
              payload: { message: 'Game is full' },
            })
          );
          return;
        }

        const playerId = uuidv4();
        game.players.push({
          id: playerId,
          name: playerName,
          chips: 1000,
          bet: 0,
          roundBet: 0,
          hand: [],
          folded: false,
          isActive: true,
          hasDealerChip: false,
          actedThisRound: false,
        });

        playerConnections.set(playerId, { ws, gameId });

        console.log(`   ✅ Player joined: ${playerName} (${playerId})`);
        console.log(`   ✅ Players in game: ${game.players.length}\n`);

        // Send response to Firefox
        ws.send(
          JSON.stringify({
            type: 'gameCreated',
            payload: { gameId, playerId },
          })
        );

        // Broadcast to all players (but don't auto-start)
        console.log(`   📢 Broadcasting gameState (waiting for host to start)...\n`);
        broadcastGameState(gameId);
      }
      else if (message.type === 'startGame') {
        // HOST STARTS GAME
        const { gameId, playerId } = message.payload;
        const game = games.get(gameId);

        if (!game) {
          console.log(`   ❌ Game not found: ${gameId}\n`);
          ws.send(
            JSON.stringify({
              type: 'error',
              payload: { message: 'Game not found' },
            })
          );
          return;
        }

        // Validate it's the host (first player)
        const isHost = game.players[0]?.id === message.payload.playerId;
        if (!isHost) {
          console.log(`   ❌ Only host can start the game\n`);
          ws.send(
            JSON.stringify({
              type: 'error',
              payload: { message: 'Only host can start the game' },
            })
          );
          return;
        }

        console.log(`   🎮 Game started by host!`);
        game.phase = 'betting1';
        game.activePlayerIndex = 0;
        game.pot = 0;
        game.highBet = 0;
        
        // Reset player states
        game.players.forEach(p => {
          p.bet = 0;
          p.roundBet = 0;
          p.folded = false;
          p.hand = [];
          p.actedThisRound = false;
        });
        
        game.community = [];
        game.deck = createDeck();
        
        // Deal cards
        dealCards(game);

        console.log(`   📢 Broadcasting gameState to all players...\n`);
        broadcastGameState(gameId);
      }
      else if (message.type === 'action') {
        // PLAYER ACTION (fold, check, bet, nextRound)
        const { gameId, action, amount, playerId } = message.payload;
        const game = games.get(gameId);

        if (!game) {
          console.log(`   ❌ Game not found: ${gameId}\n`);
          ws.send(
            JSON.stringify({
              type: 'error',
              payload: { message: 'Game not found' },
            })
          );
          return;
        }

        // nextRound doesn't require player lookup
        if (action === 'nextRound') {
          console.log(`   ↻ Starting new round`);
          game.phase = 'idle';
          game.pot = 0;
          game.highBet = 0;
          game.players.forEach(p => {
            p.bet = 0;
            p.folded = false;
            p.hand = [];
            p.roundBet = 0;
            p.actedThisRound = false;
            
            // If player is broke (0 chips), give them starting chips for rebuy
            if (p.chips === 0) {
              p.chips = 1000; // Starting chip amount
              console.log(`   💰 ${p.name} rebuys for 1000 chips`);
            }
          });
          game.community = [];
          game.winner = null;
          console.log(`   📢 Broadcasting updated gameState\n`);
          broadcastGameState(gameId);
          return;
        }

        const playerIndex = game.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
          console.log(`   ❌ Player not found\n`);
          return;
        }

        // Validate it's this player's turn (only for active betting phases)
        console.log(`   🎯 Turn check: phase=${game.phase}, playerIndex=${playerIndex}, activePlayerIndex=${game.activePlayerIndex}`);
        if (game.phase.startsWith('betting') && playerIndex !== game.activePlayerIndex) {
          console.log(`   ❌ Not ${game.players[playerIndex].name}'s turn (current: ${game.players[game.activePlayerIndex].name})\n`);
          ws.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Not your turn' }
          }));
          return;
        }

        const player = game.players[playerIndex];

        console.log(`   ⚡ Action: ${action}${amount ? ` (${amount})` : ''} by ${player.name}`);

        // Handle actions
        if (action === 'fold') {
          player.folded = true;
          console.log(`   🚫 ${player.name} folded`);
          
          const activePlayers = game.players.filter(p => !p.folded);
          if (activePlayers.length === 1) {
            // Only 1 player left - they win
            const winner = activePlayers[0];
            winner.chips += game.pot;
            console.log(`   🏆 ${winner.name} wins ${game.pot} chips (others folded)!`);
            game.phase = 'idle';
            game.pot = 0;
            game.foldWinner = {
              id: winner.id,
              name: winner.name,
              chips: winner.chips,
              potWon: game.pot,
              foldedPlayerId: player.id,
              foldedPlayerName: player.name
            };
            game.players.forEach(p => {
              p.bet = 0;
              p.folded = false;
              p.hand = [];
            });
            game.community = [];
          } else {
            // Advance to next player
            advanceActivePlayer(game);
          }
        } 
        else if (action === 'check') {
          // Player checks - only valid if they've matched the current bet
          const canCheck = game.highBet === 0 || player.roundBet >= game.highBet;
          if (!canCheck) {
            console.log(`   ❌ Cannot check - must match or exceed bet of ${game.highBet}, player round bet: ${player.roundBet}`);
            ws.send(JSON.stringify({
              type: 'error',
              payload: { message: `Must match bet of ${game.highBet}` }
            }));
            return;
          }
          player.actedThisRound = true;
          console.log(`   ✓ ${player.name} checked`);
          advanceActivePlayer(game);
          
          // Check if all bets matched
          if (allBetsMatched(game)) {
            console.log(`   ✓ All bets matched - advancing phase`);
            advancePhase(game);
          }
        }
        else if (action === 'bet') {
          if (amount <= 0 || amount > player.chips) {
            console.log(`   ❌ Invalid bet amount: ${amount} (available: ${player.chips})`);
            return;
          }
          
          const betAmount = amount;
          const previousRoundBet = player.roundBet;
          
          player.chips -= betAmount;
          player.roundBet += betAmount;
          game.pot += betAmount;
          player.actedThisRound = true;
          
          // Update highBet to the highest roundBet among all active players
          const maxRoundBet = Math.max(...game.players.filter(p => !p.folded && p.isActive).map(p => p.roundBet));
          const wasARaise = maxRoundBet > game.highBet;
          
          game.highBet = maxRoundBet;
          
          console.log(`   💰 ${player.name} bet ${betAmount} (round total: ${player.roundBet}, pot: ${game.pot})`);
          
          // If this was a raise, other players must respond
          if (wasARaise) {
            console.log(`   🔼 Raise detected! Other players must respond`);
            game.players.forEach(p => {
              if (p.id !== player.id && !p.folded) {
                p.actedThisRound = false; // Reset their action flag
              }
            });
          }
          
          advanceActivePlayer(game);
          
          // Check if all bets matched after bet
          if (allBetsMatched(game)) {
            console.log(`   ✓ All bets matched - advancing phase`);
            advancePhase(game);
          }
        }

        console.log(`   📢 Broadcasting updated gameState\n`);
        broadcastGameState(gameId);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error.message);
      ws.send(
        JSON.stringify({
          type: 'error',
          payload: { message: error.message },
        })
      );
    }
  });

  ws.on('close', () => {
    console.log('❌ Client disconnected\n');
    // Remove all connections for this ws
    for (const [playerId, conn] of playerConnections.entries()) {
      if (conn.ws === ws) {
        playerConnections.delete(playerId);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });
});

function advanceActivePlayer(game) {
  const activePlayers = game.players.filter(p => !p.folded);
  if (activePlayers.length <= 1) return;
  
  const currentPlayerIndex = game.activePlayerIndex;
  const currentPlayerName = game.players[currentPlayerIndex]?.name || 'Unknown';
  let nextIndex = (currentPlayerIndex + 1) % game.players.length;
  
  // Skip folded players and all-in players (chips === 0)
  let skipCount = 0;
  while ((game.players[nextIndex].folded || game.players[nextIndex].chips === 0) && skipCount < game.players.length) {
    nextIndex = (nextIndex + 1) % game.players.length;
    skipCount++;
  }
  
  // If all remaining active players are all-in or folded, we've looped through everyone
  if (skipCount >= game.players.length) {
    // All remaining players are all-in, end the betting round
    console.log(`   ⏭️  All players all-in or folded, not advancing`);
    return;
  }
  
  const nextPlayerName = game.players[nextIndex]?.name || 'Unknown';
  game.activePlayerIndex = nextIndex;
  console.log(`   👉 Active player: ${currentPlayerName} (${currentPlayerIndex}) → ${nextPlayerName} (${nextIndex})`);
}

function broadcastGameState(gameId) {
  const game = games.get(gameId);
  if (!game) return;

  const payload = {
    gameId: game.gameId,
    players: game.players,
    community: game.community,
    pot: game.pot,
    highBet: game.highBet,
    phase: game.phase,
    activePlayerIndex: game.activePlayerIndex,
    minBet: game.minBet,
    winner: game.winner || null,
    foldWinner: game.foldWinner || null,
  };

  const message = JSON.stringify({
    type: 'gameState',
    payload,
  });

  console.log(`   Sending to ${game.players.length} players:`);

  game.players.forEach((player) => {
    const conn = playerConnections.get(player.id);
    if (conn && conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(message);
      console.log(`     ✓ ${player.name}`);
    } else {
      console.log(`     ✗ ${player.name} (not connected)`);
    }
  });
}

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log('🎮 ═══════════════════════════════════════════════════════');
  console.log(`✅  WebSocket Poker Server listening on port ${PORT}`);
  console.log('🎮 ═══════════════════════════════════════════════════════\n');
});
