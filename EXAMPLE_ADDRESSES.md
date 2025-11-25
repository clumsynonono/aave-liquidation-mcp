# Example Addresses for Testing

This document provides example Ethereum addresses you can use to test the Aave Liquidation MCP Server.

## Important Notes

⚠️ **These are REAL addresses on Ethereum mainnet**
- Data changes in real-time as users interact with Aave
- Addresses may become inactive or change status
- Always verify on https://app.aave.com before relying on data

## How to Find Active Addresses

### Method 1: Aave Official App
1. Visit https://app.aave.com
2. Browse recent transactions
3. Click on any transaction to see the user address

### Method 2: Etherscan
1. Visit https://etherscan.io/address/0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2
2. Click on "Transactions" tab
3. Look at "From" addresses in recent transactions

### Method 3: Block Explorers
- **Dune Analytics**: https://dune.com/browse/dashboards?q=aave
- **DefiLlama**: https://defillama.com/protocol/aave-v3

### Method 4: Ask the MCP

You can ask Claude:
```
Find me some addresses that currently have positions on Aave V3.
Search for recent transactions on the Aave Pool contract.
```

## Well-Known DeFi Protocol Addresses

These addresses often have large Aave positions:

### Lending Protocols
```
0x... (Example - check Aave app for current active addresses)
```

### Institutional Users
Check Nansen or Arkham Intelligence for labeled addresses.

## Testing Different Scenarios

### Test Case 1: Healthy Position
Find an address with health factor > 1.5:
```json
{
  "tool": "get_user_health",
  "address": "PASTE_ADDRESS_HERE"
}
```

### Test Case 2: At-Risk Position
Find an address with health factor between 1.0 and 1.1:
```json
{
  "tool": "analyze_liquidation",
  "address": "PASTE_ADDRESS_HERE"
}
```

### Test Case 3: Batch Check
Test multiple addresses at once:
```json
{
  "tool": "batch_check_addresses",
  "addresses": [
    "0xAddress1",
    "0xAddress2",
    "0xAddress3"
  ]
}
```

## Finding Liquidatable Positions

Liquidatable positions (health factor < 1.0) are rare because:
1. Liquidators act quickly (often within seconds)
2. Users monitor and manage their positions
3. MEV bots are very efficient

To find liquidatable positions:
- Monitor during high volatility periods
- Check immediately after major price movements
- Use flash crash events as opportunities

## Generating Test Addresses

### Option 1: Use Historical Data
Look at past liquidation events:
```
https://etherscan.io/address/0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2#events
```
Filter for "LiquidationCall" events.

### Option 2: Monitor New Positions
Watch for new deposits:
```
https://etherscan.io/address/0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2#events
```
Filter for "Supply" events.

## Sample Queries for Claude

Once you have addresses, try these queries:

**Basic Health Check:**
```
Check the health factor for address 0xYourAddressHere
```

**Detailed Analysis:**
```
Give me a detailed liquidation analysis for 0xYourAddressHere including:
- Health factor
- Collateral breakdown
- Debt composition
- Risk assessment
```

**Batch Monitoring:**
```
I want to monitor these 5 addresses for liquidation risk:
[paste addresses]

Create a summary showing which ones are at risk.
```

**Research Query:**
```
Find active Aave users by looking at recent pool transactions,
then analyze the top 3 by debt size.
```

## Privacy and Ethics

**Important reminders:**
- These are public blockchain addresses (not private)
- All data is publicly available on Ethereum
- Do not harass or contact address owners
- Use for research and education only
- Respect others' financial privacy

## Where to Get Real-Time Addresses

1. **Aave Subgraph** (The Graph):
   - Query active positions
   - Filter by health factor
   - Sort by position size

2. **Aave API** (if available):
   - Official Aave data endpoints

3. **Analytics Platforms**:
   - Dune Analytics dashboards
   - Nansen portfolio tracker
   - Arkham Intelligence

## Example MCP Workflow

Here's a complete workflow to find and analyze addresses:

1. **Get Protocol Info:**
   ```
   What's the current status of Aave V3?
   ```

2. **Get Available Assets:**
   ```
   Show me all assets available on Aave V3
   ```

3. **Find Addresses** (manually or through other tools):
   - Browse Etherscan
   - Check Dune dashboards
   - Use The Graph

4. **Analyze Addresses:**
   ```
   Check health factors for these addresses: [list]
   ```

5. **Deep Dive:**
   ```
   For any at-risk addresses, give me detailed analysis
   ```

## Updating This Document

As you find good example addresses, please consider contributing them back to this document via a pull request. Include:
- Address
- Date found
- Health factor at time of discovery
- Position size (approximate)
- Why it's a good example

## Disclaimer

- Addresses listed here are examples only
- Financial situations change rapidly
- Always verify current data before making decisions
- This tool is for educational purposes only
- Not financial advice
