/**
 * Demo script to get ETH price from Aave V3 Oracle
 * This script demonstrates the get_asset_price functionality without shell escaping issues
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const AAVE_V3_ORACLE = '0x54586bE62E3c3580375aE3723C145253060Ca0C2';
const RPC_URL = process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com';

const ORACLE_ABI = [
  'function getAssetPrice(address asset) external view returns (uint256)',
];

async function getETHPrice() {
  try {
    console.log('🔍 Fetching ETH price from Aave V3 Oracle...\n');

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const oracleContract = new ethers.Contract(AAVE_V3_ORACLE, ORACLE_ABI, provider);

    const priceRaw = await oracleContract.getAssetPrice(WETH_ADDRESS);
    const priceInUSD = ethers.formatUnits(priceRaw, 8);

    console.log('💰 Current ETH Price: $' + parseFloat(priceInUSD).toFixed(2) + ' USD');
    console.log('📊 Raw oracle data: ' + priceRaw.toString());
    console.log('🏦 Data source: Aave V3 Oracle');
    console.log('🔗 Oracle contract: ' + AAVE_V3_ORACLE);
    console.log('🌐 Network: Ethereum Mainnet');
    console.log('⏰ Timestamp: ' + new Date().toISOString());

    return {
      price: parseFloat(priceInUSD),
      raw: priceRaw.toString(),
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('❌ Error fetching ETH price:', error.message);

    if (error.code === 'NETWORK_ERROR') {
      console.log('💡 Tip: Try using a different RPC endpoint');
      console.log('   Get free RPC from: Alchemy, Infura, or QuickNode');
    } else if (error.code === 'CALL_EXCEPTION') {
      console.log('💡 Tip: Contract call failed - check if the oracle contract address is correct');
    }

    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  getETHPrice()
    .then(() => console.log('\n✅ Demo completed successfully!'))
    .catch(() => process.exit(1));
}

export { getETHPrice };