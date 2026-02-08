/**
 * Test script for Yellow Network integration on Base mainnet
 * 
 * Usage: npx tsx test-yellow.ts
 */

import { YellowSession } from './game/YellowSession';
import 'dotenv/config';

async function main() {
    // Check for credentials
    if (!process.env.SEED_PHRASE && !process.env.PRIVATE_KEY) {
        console.log('⚠️  No SEED_PHRASE or PRIVATE_KEY found in .env');
        console.log('   Using test mode with generated key...\n');
    }

    console.log('🎰 Yellow Network Test - Base Mainnet');
    console.log('════════════════════════════════════════\n');

    const session = new YellowSession();
    console.log(`📍 Wallet: ${session.getAccountAddress()}`);

    // Step 1: Connect and authenticate
    console.log('\n1️⃣ Connecting to Yellow Network...');
    await session.connect();

    // Step 2: Create channel (optional - requires funds)
    console.log('\n2️⃣ Creating USDC channel on Base...');
    console.log('   ⏩ Skipping (requires deposited funds)');
    // const channelId = await session.createChannel();

    // Step 3: Show available methods
    console.log('\n📋 Available Operations:');
    console.log('   • deposit(amount) - Deposit USDC to custody');
    console.log('   • createChannel() - Create USDC channel');
    console.log('   • resizeChannel({resizeAmount, allocateAmount})');
    console.log('   • sendGameAction(action, amount?)');
    console.log('   • getSettlementProof(...)');

    console.log('\n✅ Test Complete!');
    console.log('   Connection verified, session ready.\n');

    await session.disconnect();
}

main().catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
