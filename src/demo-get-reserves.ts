/**
 * Demo script to get Aave V3 reserves without shell escaping issues
 * This demonstrates the get_aave_reserves functionality
 */

import { ethers } from 'ethers';

const AAVE_V3_POOL_DATA_PROVIDER = '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3';

const DATA_PROVIDER_ABI = [
  'function getAllReservesTokens() external view returns (tuple(string symbol, address tokenAddress)[])',
];

async function getAaveReserves() {
  try {
    console.log('🏦 Fetching Aave V3 reserves data...\n');

    const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
    const dataProviderContract = new ethers.Contract(AAVE_V3_POOL_DATA_PROVIDER, DATA_PROVIDER_ABI, provider);

    const reservesTokens = await dataProviderContract.getAllReservesTokens();

    console.log('📊 Total Aave V3 reserves: ' + reservesTokens.length + ' assets\n');

    console.log('💎 Reserve assets:');
    console.log('');

    // Group assets by category
    const categories = {
      eth: [] as Array<{symbol: string, address: string, index: number}>,
      btc: [] as Array<{symbol: string, address: string, index: number}>,
      stablecoins: [] as Array<{symbol: string, address: string, index: number}>,
      defi: [] as Array<{symbol: string, address: string, index: number}>,
      other: [] as Array<{symbol: string, address: string, index: number}>
    };

    reservesTokens.forEach((reserve: any, index: number) => {
      const symbol = reserve[0];
      const address = reserve[1];

      // Categorize
      if (symbol.includes('ETH') || symbol.includes('eth')) {
        categories.eth.push({ symbol, address, index: index + 1 });
      } else if (symbol.includes('BTC') || symbol.includes('btc')) {
        categories.btc.push({ symbol, address, index: index + 1 });
      } else if (['USDC', 'USDT', 'DAI', 'LUSD', 'FRAX', 'GHO', 'USD', 'USDe'].some(s => symbol.includes(s))) {
        categories.stablecoins.push({ symbol, address, index: index + 1 });
      } else if (['AAVE', 'LINK', 'UNI', 'MKR', 'CRV', 'SNX', 'BAL', 'LDO'].includes(symbol)) {
        categories.defi.push({ symbol, address, index: index + 1 });
      } else {
        categories.other.push({ symbol, address, index: index + 1 });
      }
    });

    // Display by category
    console.log('🚀 Ethereum-based assets:');
    categories.eth.slice(0, 5).forEach(asset => {
      console.log('  ' + asset.index.toString().padStart(2) + '. ' + asset.symbol.padEnd(10) + ' | ' + asset.address);
    });

    console.log('\n🟡 Bitcoin-based assets:');
    categories.btc.slice(0, 3).forEach(asset => {
      console.log('  ' + asset.index.toString().padStart(2) + '. ' + asset.symbol.padEnd(10) + ' | ' + asset.address);
    });

    console.log('\n💰 Stablecoins:');
    categories.stablecoins.slice(0, 5).forEach(asset => {
      console.log('  ' + asset.index.toString().padStart(2) + '. ' + asset.symbol.padEnd(10) + ' | ' + asset.address);
    });

    console.log('\n🎯 DeFi tokens:');
    categories.defi.slice(0, 5).forEach(asset => {
      console.log('  ' + asset.index.toString().padStart(2) + '. ' + asset.symbol.padEnd(10) + ' | ' + asset.address);
    });

    console.log('\n📈 Other assets: ' + categories.other.length + ' more');
    console.log('\n✅ Successfully fetched ' + reservesTokens.length + ' Aave V3 reserves!');

    return reservesTokens;

  } catch (error: any) {
    console.error('❌ Error fetching reserves:', error.message);

    if (error.code === 'NETWORK_ERROR') {
      console.log('💡 Tip: Check your RPC endpoint');
    } else if (error.code === 'CALL_EXCEPTION') {
      console.log('💡 Tip: Contract address may be incorrect');
    }

    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  getAaveReserves()
    .then(() => console.log('\n✅ Demo completed successfully!'))
    .catch(() => process.exit(1));
}

export { getAaveReserves };