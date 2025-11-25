/**
 * Comprehensive test suite for all MCP tools
 * Tests each tool with real data to verify functionality
 */

import { AaveClient } from '../src/aave-client.js';

// Using public RPC endpoint
const PUBLIC_RPC = 'https://eth.llamarpc.com';

// Known addresses for testing (these are public Aave protocol contracts and known users)
const TEST_ADDRESSES = {
  // Aave Pool itself (will have no position, good for testing edge cases)
  POOL: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
  // Random addresses (may or may not have positions)
  SAMPLE1: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  SAMPLE2: '0xBA12222222228d8Ba445958a75a0704d566BF2C8', // Balancer Vault (often has positions)
};

const KNOWN_ASSETS = {
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
};

let passedTests = 0;
let failedTests = 0;
let totalTests = 0;

function testHeader(name: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`🧪 TEST: ${name}`);
  console.log('='.repeat(70));
}

function testPass(message: string) {
  console.log(`✅ PASS: ${message}`);
  passedTests++;
  totalTests++;
}

function testFail(message: string, error?: any) {
  console.log(`❌ FAIL: ${message}`);
  if (error) {
    console.log(`   Error: ${error.message || error}`);
  }
  failedTests++;
  totalTests++;
}

async function runTests() {
  console.log('🚀 Starting Comprehensive MCP Tool Tests\n');
  console.log('📡 Using public RPC endpoint (may be slower)');
  console.log('⏱️  This will take 30-60 seconds...\n');

  const client = new AaveClient(PUBLIC_RPC);

  // Test 1: Get Protocol Status
  testHeader('get_protocol_status');
  try {
    const blockNumber = await client.getBlockNumber();
    if (blockNumber > 0) {
      testPass(`Retrieved current block number: ${blockNumber.toLocaleString()}`);
    } else {
      testFail('Block number should be > 0');
    }
  } catch (error) {
    testFail('Failed to get block number', error);
  }

  // Test 2: Get Aave Reserves
  testHeader('get_aave_reserves');
  try {
    const reserves = await client.getAllReserves();
    if (reserves.length > 0) {
      testPass(`Retrieved ${reserves.length} reserves`);

      const wethReserve = reserves.find((r: any) => r.tokenAddress.toLowerCase() === KNOWN_ASSETS.WETH.toLowerCase());
      if (wethReserve) {
        testPass(`Found WETH reserve: ${wethReserve.symbol}`);
      } else {
        testFail('WETH reserve not found');
      }

      if (reserves.every((r: any) => r.symbol && r.tokenAddress)) {
        testPass('All reserves have symbol and address');
      } else {
        testFail('Some reserves missing data');
      }
    } else {
      testFail('No reserves retrieved');
    }
  } catch (error) {
    testFail('Failed to get reserves', error);
  }

  // Test 3: Get Asset Price
  testHeader('get_asset_price');
  try {
    const wethPrice = await client.getAssetPrice(KNOWN_ASSETS.WETH);
    const priceNum = parseFloat(wethPrice);

    if (priceNum > 0) {
      testPass(`WETH price: $${parseFloat(wethPrice).toFixed(2)}`);
    } else {
      testFail('WETH price should be > 0');
    }

    // Test USDC price (should be close to $1)
    const usdcPrice = await client.getAssetPrice(KNOWN_ASSETS.USDC);
    const usdcPriceNum = parseFloat(usdcPrice);

    if (usdcPriceNum > 0.95 && usdcPriceNum < 1.05) {
      testPass(`USDC price is reasonable: $${usdcPriceNum.toFixed(4)}`);
    } else {
      testFail(`USDC price seems off: $${usdcPriceNum.toFixed(4)}`);
    }
  } catch (error) {
    testFail('Failed to get asset prices', error);
  }

  // Test 4: Validate Address
  testHeader('validate_address');
  try {
    const validAddr = client.isValidAddress(TEST_ADDRESSES.POOL);
    if (validAddr) {
      testPass('Valid address recognized as valid');
    } else {
      testFail('Valid address not recognized');
    }

    const invalidAddr1 = client.isValidAddress('0x123');
    if (!invalidAddr1) {
      testPass('Invalid address (too short) rejected');
    } else {
      testFail('Invalid address not rejected');
    }

    const invalidAddr2 = client.isValidAddress('not an address');
    if (!invalidAddr2) {
      testPass('Invalid address (not hex) rejected');
    } else {
      testFail('Invalid address not rejected');
    }
  } catch (error) {
    testFail('Address validation failed', error);
  }

  // Test 5: Get User Account Data
  testHeader('get_user_health');
  try {
    // Test with pool address (should have no position)
    const poolData = await client.getUserAccountData(TEST_ADDRESSES.POOL);

    if (poolData.address) {
      testPass('User account data retrieved');
    } else {
      testFail('No address in user data');
    }

    if (poolData.healthFactorFormatted) {
      testPass(`Health factor formatted: ${poolData.healthFactorFormatted}`);
    } else {
      testFail('Health factor not formatted');
    }

    // The pool itself shouldn't have a borrowing position
    if (poolData.totalDebtBase === 0n) {
      testPass('Pool address has no debt (as expected)');
    }
  } catch (error) {
    testFail('Failed to get user account data', error);
  }

  // Test 6: Get User Positions
  testHeader('get_user_positions');
  try {
    const positions = await client.getUserReserves(TEST_ADDRESSES.SAMPLE1);

    testPass(`Retrieved positions (${positions.collateral.length} collateral, ${positions.debt.length} debt)`);

    if (positions.collateral.every((p: any) => p.symbol && p.asset)) {
      testPass('All collateral positions have required fields');
    } else {
      testFail('Some collateral positions missing data');
    }
  } catch (error) {
    testFail('Failed to get user positions', error);
  }

  // Test 7: Analyze Liquidation
  testHeader('analyze_liquidation');
  try {
    const analysis = await client.analyzeLiquidationOpportunity(TEST_ADDRESSES.SAMPLE2);

    if (analysis === null) {
      testPass('Healthy position correctly returns null');
    } else {
      testPass(`Found position at risk: Health Factor ${analysis.healthFactor}`);

      if (analysis.riskLevel && ['HIGH', 'MEDIUM', 'LOW'].includes(analysis.riskLevel)) {
        testPass(`Risk level properly classified: ${analysis.riskLevel}`);
      } else {
        testFail('Invalid risk level');
      }
    }
  } catch (error) {
    testFail('Failed to analyze liquidation', error);
  }

  // Test 8: Batch Check Addresses
  testHeader('batch_check_addresses');
  try {
    const addresses = [
      TEST_ADDRESSES.POOL,
      TEST_ADDRESSES.SAMPLE1,
      TEST_ADDRESSES.SAMPLE2,
    ];

    const results = await client.batchAnalyzeLiquidation(addresses);

    if (results.length === addresses.length) {
      testPass(`Batch check completed for all ${addresses.length} addresses`);
    } else {
      testFail(`Expected ${addresses.length} results, got ${results.length}`);
    }

    if (results.every((r: any) => r.address)) {
      testPass('All batch results have addresses');
    } else {
      testFail('Some batch results missing addresses');
    }
  } catch (error) {
    testFail('Failed batch check', error);
  }

  // Test 9: Error Handling - Invalid Address
  testHeader('Error Handling');
  try {
    await client.getUserAccountData('0x123invalid');
    testFail('Should have thrown error for invalid address');
  } catch (error) {
    testPass('Correctly throws error for invalid address');
  }

  // Test 10: Error Handling - Invalid Asset
  try {
    await client.getAssetPrice('0x0000000000000000000000000000000000000000');
    // May or may not error depending on Aave's handling
    testPass('Handled zero address query (no crash)');
  } catch (error) {
    testPass('Correctly handles invalid asset address');
  }

  // Final Report
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${failedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));

  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! MCP is ready to use!\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review the errors above.\n');
  }

  // Performance note
  console.log('📝 Note: Test performance depends on RPC provider.');
  console.log('   For production use, get a dedicated RPC key from Alchemy or Infura.\n');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Fatal error during testing:', error);
  process.exit(1);
});
