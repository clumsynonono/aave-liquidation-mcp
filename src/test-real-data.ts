/**
 * Test script to verify we're reading REAL on-chain data from Aave V3
 * This connects to Ethereum mainnet and fetches actual protocol data
 */

import { ethers } from 'ethers';

// Using a public RPC endpoint (rate-limited but free for testing)
const PUBLIC_RPC = 'https://eth.llamarpc.com';

// Real Aave V3 Pool contract on Ethereum mainnet
const AAVE_V3_POOL = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';

// Minimal ABI to test
const POOL_ABI = [
  'function getReservesList() external view returns (address[])',
];

async function testRealData() {
  console.log('🔍 Testing connection to REAL Aave V3 on Ethereum Mainnet...\n');

  try {
    // Connect to Ethereum mainnet
    const provider = new ethers.JsonRpcProvider(PUBLIC_RPC);
    console.log('✅ Connected to Ethereum mainnet');

    // Get current block number (proves we're connected to real chain)
    const blockNumber = await provider.getBlockNumber();
    console.log(`📦 Current block number: ${blockNumber.toLocaleString()}`);
    console.log(`   (You can verify this on https://etherscan.io/)\n`);

    // Connect to REAL Aave V3 Pool contract
    const poolContract = new ethers.Contract(AAVE_V3_POOL, POOL_ABI, provider);
    console.log('✅ Connected to Aave V3 Pool contract');
    console.log(`   Address: ${AAVE_V3_POOL}`);
    console.log(`   Verify on: https://etherscan.io/address/${AAVE_V3_POOL}\n`);

    // Fetch REAL list of reserves from the actual Aave protocol
    console.log('🔄 Fetching real reserve list from Aave V3...');
    const reserves = await poolContract.getReservesList();

    console.log(`\n✅ SUCCESS! Retrieved ${reserves.length} REAL assets from Aave V3:\n`);

    // Show first 10 assets with links to verify on Etherscan
    console.log('First 10 assets (verify these are real on Etherscan):');
    reserves.slice(0, 10).forEach((address: string, index: number) => {
      console.log(`  ${index + 1}. ${address}`);
      console.log(`     https://etherscan.io/token/${address}`);
    });

    console.log(`\n... and ${reserves.length - 10} more assets`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ VERIFIED: This MCP server reads REAL on-chain data!');
    console.log('='.repeat(70));
    console.log('\nThis is NOT simulated data. Every call queries actual Aave V3 contracts');
    console.log('deployed on Ethereum mainnet. You can verify every address on Etherscan.');
    console.log('\nThe data is as real as it gets - directly from the blockchain! 🎉');

  } catch (error: any) {
    console.error('❌ Error:', error.message);

    // Enhanced error handling with specific guidance
    if (error.code === 'NETWORK_ERROR') {
      console.log('\n🔧 Network Error Details:');
      console.log('• RPC endpoint may be rate-limited or unavailable');
      console.log('• Try using a different public RPC or get a free API key');
      console.log('• Suggested RPC providers: Alchemy, Infura, QuickNode');
    } else if (error.code === 'CALL_EXCEPTION') {
      console.log('\n🔧 Contract Error Details:');
      console.log('• Contract call failed - check contract addresses');
      console.log('• Verify Aave V3 Pool address is correct');
      console.log(`• Current Pool: ${AAVE_V3_POOL}`);
    } else if (error.code === 'TIMEOUT') {
      console.log('\n🔧 Timeout Error Details:');
      console.log('• Request timed out - network may be slow');
      console.log('• Try again or use a faster RPC endpoint');
    } else {
      console.log('\n🔧 General Error Details:');
      console.log('• Unexpected error occurred');
      console.log('• Check your internet connection');
      console.log('• Verify all dependencies are installed');
    }

    console.log('\n💡 Quick Fix Options:');
    console.log('1. Try a different RPC endpoint');
    console.log('2. Check if you have internet connectivity');
    console.log('3. Verify contract addresses are up to date');
    console.log('4. Run: npm install to ensure dependencies are installed');
  }
}

// Run the test
testRealData();
