# Aave Liquidation MCP Server

A Model Context Protocol (MCP) server for analyzing Aave V3 liquidation opportunities on Ethereum mainnet. This tool enables AI assistants like Claude to interact with Aave protocol data, monitor user positions, and identify liquidation opportunities.

## Features

- **Health Factor Monitoring**: Check user account health and liquidation status
- **Liquidation Analysis**: Detailed analysis of liquidation opportunities with risk levels
- **Position Tracking**: View user collateral and debt positions across all Aave assets
- **Reserve Information**: Query available Aave V3 reserves and their configurations
- **Price Data**: Get real-time asset prices from Aave oracle
- **Protocol Status**: Monitor Aave V3 protocol health and status

## What Makes This Different

Unlike existing liquidation bots that execute liquidations, this MCP server focuses on:
- **Analysis over Execution**: Provides data and insights rather than executing transactions
- **AI-First Design**: Optimized for integration with AI assistants via MCP protocol
- **Educational Value**: Helps users understand DeFi liquidation mechanics
- **Research Tool**: Useful for strategy development and risk analysis

## Installation

### Prerequisites

- Node.js 18 or higher
- An Ethereum RPC endpoint (Alchemy, Infura, QuickNode, or your own node)

### Setup

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and add your Ethereum RPC URL
   ```

4. Build the project:
   ```bash
   npm run build
   ```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Required: Ethereum RPC endpoint
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Optional: Health factor warning threshold (default: 1.05)
HEALTH_FACTOR_THRESHOLD=1.05
```

### Getting an RPC Endpoint

You can get a free Ethereum RPC endpoint from:
- **Alchemy**: https://www.alchemy.com/ (Recommended, 300M compute units/month free)
- **Infura**: https://www.infura.io/ (100k requests/day free)
- **QuickNode**: https://www.quicknode.com/ (Free tier available)

### MCP Configuration

Add this server to your Claude Desktop configuration file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "aave-liquidation": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/aave-liquidation-mcp/build/index.js"],
      "env": {
        "ETHEREUM_RPC_URL": "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
      }
    }
  }
}
```

Replace `/ABSOLUTE/PATH/TO/` with the actual path to your installation.

## Available Tools (8 Total)

### 1. `get_user_health`

Get health factor and account data for a specific address.

**Input:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
}
```

**Output:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "healthFactor": "1.234",
  "totalCollateralUSD": "150000.00",
  "totalDebtUSD": "100000.00",
  "availableBorrowsUSD": "20000.00",
  "liquidationThreshold": "0.85",
  "ltv": "0.80",
  "isLiquidatable": false,
  "isAtRisk": false,
  "status": "HEALTHY"
}
```

### 2. `analyze_liquidation`

Analyze a position for liquidation opportunity with detailed breakdown.

**Input:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
}
```

**Output:**
```json
{
  "userAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "healthFactor": "0.98",
  "totalCollateralUSD": "150000.00",
  "totalDebtUSD": "140000.00",
  "riskLevel": "HIGH",
  "potentialProfit": "7000.00",
  "collateralAssets": [...],
  "debtAssets": [...]
}
```

### 3. `get_user_positions`

Get detailed collateral and debt positions for an address.

**Input:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
}
```

### 4. `get_aave_reserves`

Get list of all available Aave V3 reserves with their configurations.

**Input:** None required

**Output:** List of all reserves with LTV, liquidation threshold, liquidation bonus, etc.

### 5. `get_asset_price`

Get current USD price for a specific asset from Aave oracle.

**Input:**
```json
{
  "assetAddress": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
}
```

### 6. `get_protocol_status`

Get Aave V3 protocol status and current block number.

**Input:** None required

### 7. `batch_check_addresses`

Check multiple addresses at once for liquidation opportunities (max 20 addresses per request).

**Input:**
```json
{
  "addresses": [
    "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "0xAnotherAddress...",
    "0xYetAnotherAddress..."
  ]
}
```

**Output:**
```json
{
  "totalChecked": 3,
  "liquidatable": 1,
  "atRisk": 1,
  "healthy": 1,
  "results": [...]
}
```

### 8. `validate_address`

Validate if a string is a properly formatted Ethereum address.

**Input:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
}
```

**Output:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "isValid": true,
  "message": "Valid Ethereum address format"
}
```

## Usage Examples

Once configured with Claude Desktop, you can ask questions like:

**Single Address Queries:**
- "Check the health factor for address 0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
- "Are there any liquidation opportunities for this address?"
- "What are the collateral positions for this user?"
- "Analyze this address for liquidation risk: 0x..."

**Batch Operations:**
- "Check these 5 addresses for liquidation risk: [paste addresses]"
- "Monitor multiple wallets and tell me which ones are at risk"
- "Compare liquidation risk across these addresses"

**Protocol Queries:**
- "Show me all available assets in Aave V3"
- "What's the current price of WETH in Aave?"
- "What are the liquidation parameters for USDC?"
- "What's the current block number?"

**Validation:**
- "Is this a valid Ethereum address: 0x123..."
- "Validate these addresses before I check them"

## Understanding the Data

### Health Factor

- **> 1.0**: Position is healthy
- **< 1.05**: Position is at risk (warning)
- **< 1.0**: Position can be liquidated

### Risk Levels

- **HIGH**: Health factor < 1.0 (immediately liquidatable)
- **MEDIUM**: Health factor between 1.0 and 1.02
- **LOW**: Health factor between 1.02 and 1.05

### Liquidation Bonus

When a position is liquidated, the liquidator receives a bonus (typically 5-10% depending on the asset). The `potentialProfit` field estimates this bonus.

## Development

### Project Structure

```
aave-liquidation-mcp/
├── src/
│   ├── index.ts           # MCP server implementation
│   ├── aave-client.ts     # Aave protocol interaction logic
│   ├── constants.ts       # Contract addresses and ABIs
│   └── types.ts           # TypeScript type definitions
├── build/                 # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── .env                   # Configuration
```

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

This will watch for file changes and recompile automatically.

## Technical Details

### Aave V3 Contracts (Ethereum Mainnet)

- **Pool**: `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`
- **Pool Data Provider**: `0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3`
- **Oracle**: `0x54586bE62E3c3580375aE3723C145253060Ca0C2`

### Dependencies

- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `ethers`: Ethereum library for contract interaction
- `dotenv`: Environment variable management

## Limitations

- **Mainnet Only**: Currently supports Ethereum mainnet only
- **Read-Only**: Does not execute liquidations, only analyzes opportunities
- **Rate Limits**: Subject to your RPC provider's rate limits
- **Gas Estimation**: Profit calculations are estimates and don't account for gas costs

## Future Enhancements

- [ ] Multi-chain support (Arbitrum, Optimism, Polygon, Base)
- [ ] Historical liquidation data and analytics
- [ ] Advanced profit calculations including gas costs
- [ ] Webhook notifications for at-risk positions
- [ ] Integration with The Graph for historical queries
- [ ] Support for Aave V2 alongside V3

## Resources

- [Aave V3 Documentation](https://docs.aave.com/developers/getting-started/readme)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Liquidation Guide](https://docs.aave.com/developers/guides/liquidations)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Disclaimer

This tool is for educational and research purposes only. Liquidating positions on DeFi protocols involves financial risk. Always do your own research and understand the risks before participating in DeFi activities.
