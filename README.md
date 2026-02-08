# 🃏 Texas Hold'em Poker on Yellow Network & Base

## Short Description
Gasless L2 Poker using Yellow Network for state channels and Base for identity.

## Detailed Description
This project is a decentralized, 2-player Texas Hold'em Poker game that showcases the power of Layer 2 solutions for high-frequency gaming. It overcomes the latency and gas cost issues of traditional on-chain games by moving the gameplay (dealing, betting, folding) to off-chain state channels, while retaining the security of on-chain asset settlement.

Players connect securely via their Base wallets, authenticated by Basenames (ENS on Base). Game sessions are managed as App Sessions on the Yellow Network, allowing for instant, gasless interactions. Funds are only moved on-chain during the initial deposit and final settlement, ensuring a seamless and cost-effective user experience.

## How It's Made
The game is built using a combination of next-generation Web3 technologies to deliver a seamless experience. The core gameplay logic runs on an off-chain infrastructure powered by the Yellow Network SDK, specifically utilizing App Sessions to manage game states securely without gas fees. Each player interaction, such as betting or folding, is cryptographically signed and exchanged instantly through these state channels. For identity and settlement, the application integrates with the Base blockchain, using Basenames to resolve human-readable identities like alice.base.eth directly within the UI. The frontend is developed with Next.js and React for a responsive interface, while real-time communication is handled via WebSockets to ensure zero latency during gameplay. On-chain transactions are limited to the initial funding and final settlement of the game session, combining the speed of traditional gaming with the security of blockchain assets.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- [Yellow Network Account](https://yellow.org/)
- Base Mainnet Wallet with USDC

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kavishshahh/poker-next.git
   cd poker-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in `server/` with your wallet keys:
   ```env
   PRIVATE_KEY=your_alice_private_key
   PRIV_KEY=your_bob_private_key
   RPC_URL=https://mainnet.base.org
   ```

---

## 🎮 Running the Demo

The project includes a complete script-based demo simulating a 2-player game.

### 1. Start the Backend & Frontend
Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
# Needed for WebSocket connections
npx tsx server/server.ts
```

**Terminal 2 (Frontend - Optional for script demo):**
```bash
npm run dev
```

### 2. Run the Poker Simulation
Run the automated game script to see a full hand played out on the console:

```bash
cd server
npx tsx scripts/poker-game.ts
```

**What happens in the script:**
1. 🔐 Authenticates Alice & Bob with Yellow Network
2. 💰 Creates a Poker App Session (0.01 USDC buy-in)
3. 🃏 Deals random hole cards
4. 📢 Simulates betting rounds (Pre-flop → River)
5. 🏆 Determines winner at Showdown
6. 💸 Settles funds on-chain via App Session closure

### 3. Manage Funds (Optional)
Scripts to manage your Yellow Network channels:

- **Check Balance**: `npx tsx scripts/check-balance.ts`
- **Deposit to Custody**: `npx tsx scripts/deposit.ts -a 0.1`
- **Create Channel**: `npx tsx scripts/create-channel.ts -a 0.05`
- **Move to Unified Balance**: `npx tsx scripts/resize-channel.ts -a`

---

## 🛠️ Technical Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Blockchain**: Base (Coinbase L2)
- **Identity**: Basenames (ENS on Base)
- **State Channels**: Yellow Network SDK (`@erc7824/nitrolite`)
- **Web3**: Wagmi, Viem, RainbowKit

## 📄 License
MIT
