# Example Usage

This document provides practical examples of how to use the Aave Liquidation MCP Server with Claude.

## Setup Verification

After installing and configuring the server, restart Claude Desktop and verify it's working:

**Ask Claude:**
```
Can you check the Aave protocol status?
```

Claude will use the `get_protocol_status` tool and should return something like:
```json
{
  "protocol": "Aave V3",
  "network": "Ethereum Mainnet",
  "blockNumber": 18500000,
  "poolAddress": "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
  "status": "operational"
}
```

## Example 1: Check a User's Health Factor

**Prompt:**
```
Check the health factor for address 0x742d35Cc6634C0532925a3b844Bc454e4438f44e on Aave
```

Claude will call `get_user_health` and provide an analysis of the position's health.

## Example 2: Find Liquidation Opportunities

**Prompt:**
```
Analyze liquidation opportunities for these addresses:
- 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
- 0x1234567890123456789012345678901234567890

Tell me which ones are liquidatable and why.
```

Claude will analyze each address and provide a detailed report including:
- Health factors
- Risk levels
- Potential profits
- Collateral and debt breakdown

## Example 3: Monitor a Specific User

**Prompt:**
```
I want to monitor address 0xABCD... on Aave. Show me:
1. Their current health factor
2. All their collateral positions
3. All their debt positions
4. Whether they're at risk of liquidation
```

## Example 4: Research Aave Assets

**Prompt:**
```
What assets are available on Aave V3? Show me their liquidation parameters.
```

Claude will use `get_aave_reserves` to list all assets with their:
- Loan-to-Value (LTV) ratios
- Liquidation thresholds
- Liquidation bonuses
- Whether they can be used as collateral

## Example 5: Price Queries

**Prompt:**
```
What's the current price of WETH (0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2) according to Aave oracle?
```

## Example 6: Complex Analysis

**Prompt:**
```
I'm researching liquidations on Aave. Can you:
1. Check if address 0xXYZ is liquidatable
2. If yes, calculate the potential profit
3. List which collateral assets they have
4. Show their debt composition
5. Explain the liquidation mechanics for this specific case
```

Claude will combine multiple tool calls and provide a comprehensive analysis with explanations.

## Example 7: Comparative Analysis

**Prompt:**
```
Compare these three addresses and tell me which one presents the best liquidation opportunity:
- 0xAddress1
- 0xAddress2
- 0xAddress3

Consider health factor, total debt value, and potential profit.
```

## Example 8: Educational Queries

**Prompt:**
```
Using a real example from Aave, explain to me how liquidations work. Find a user who is at risk (health factor between 1.0 and 1.1) and walk me through what would happen if their health factor drops below 1.0.
```

## Example 9: Asset Research

**Prompt:**
```
I want to understand the risk parameters for USDC on Aave V3. What are its LTV, liquidation threshold, and liquidation bonus?
```

## Example 10: Finding Addresses to Monitor

To find interesting addresses to monitor, you can:

1. Use blockchain explorers like Etherscan
2. Look at recent Aave transactions
3. Check Aave's top borrowers on analytics platforms like Dune

**Example addresses to try (anonymized examples):**
- Large DeFi protocols that use Aave
- Known whale addresses
- Addresses found on Aave liquidation dashboards

## Tips for Best Results

1. **Be Specific**: Provide exact addresses when possible
2. **Ask for Context**: Ask Claude to explain what the numbers mean
3. **Combine Queries**: Ask for multiple pieces of information in one prompt
4. **Request Comparisons**: Compare multiple addresses or time periods
5. **Educational Focus**: Ask Claude to explain the mechanics, not just show data

## Understanding the Output

### Health Factor Interpretation

```
Health Factor > 1.5  → Very Safe
Health Factor 1.1-1.5 → Safe
Health Factor 1.05-1.1 → Moderate Risk
Health Factor 1.0-1.05 → High Risk (Warning)
Health Factor < 1.0  → Liquidatable
```

### Risk Levels

- **HIGH**: Immediate liquidation possible
- **MEDIUM**: Close to liquidation, monitor closely
- **LOW**: At risk but not immediate danger

## Troubleshooting

**If tools aren't working:**

1. Check that Claude Desktop is restarted after configuration
2. Verify your `.env` file has a valid RPC URL
3. Check the RPC endpoint is working (test with curl or web browser)
4. Look at Claude's error messages for hints

**Common Issues:**

- **"No liquidation opportunity found"**: The address has a healthy position
- **RPC errors**: Your RPC endpoint might be rate-limited or down
- **Invalid address**: Make sure the address is a valid Ethereum address with 0x prefix

## Advanced Usage

### Monitoring Multiple Addresses

Create a list of addresses and ask Claude to check them all:

```
I have these addresses I want to monitor for liquidation risk on Aave:

1. 0xAddress1
2. 0xAddress2
3. 0xAddress3
4. 0xAddress4

Please check each one and create a risk report with:
- Health factor
- Total position size
- Risk level
- Whether I should watch them closely
```

### Creating Alerts

```
Check address 0xXYZ and tell me what health factor level I should watch for to get 10 minutes warning before liquidation. Consider typical price volatility for their collateral assets.
```

### Strategy Analysis

```
I'm thinking about liquidating positions on Aave. Using the current data, explain:
1. What makes a good liquidation opportunity?
2. What are the risks?
3. What tools would I need besides this MCP server?
```

## Next Steps

After getting familiar with the basic tools:

1. Explore different addresses on Aave
2. Understand the relationship between collateral, debt, and health factor
3. Research liquidation bonuses for different assets
4. Learn about the MEV (Maximal Extractable Value) landscape
5. Consider building additional tools that complement this MCP server
