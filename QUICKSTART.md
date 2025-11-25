# Quick Start Guide

Get up and running with Aave Liquidation MCP Server in 5 minutes.

## Step 1: Get an RPC Endpoint (2 minutes)

1. Go to https://www.alchemy.com/
2. Sign up for a free account
3. Create a new app:
   - Chain: Ethereum
   - Network: Mainnet
4. Copy your API endpoint URL (looks like: `https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY`)

## Step 2: Configure the Server (1 minute)

1. Open the `.env` file in this directory
2. Replace `YOUR_API_KEY_HERE` with your actual Alchemy API key:
   ```env
   ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/abc123def456
   ```
3. Save the file

## Step 3: Verify Installation (30 seconds)

Run this command to verify everything is working:

```bash
npm run build
```

If you see "compiled successfully" or similar, you're good to go!

## Step 4: Add to Claude Desktop (1 minute)

### macOS

1. Open: `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add this (update the path to match your installation):

```json
{
  "mcpServers": {
    "aave-liquidation": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/aave-liquidation-mcp/build/index.js"],
      "env": {
        "ETHEREUM_RPC_URL": "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
      }
    }
  }
}
```

### Windows

1. Open: `%APPDATA%/Claude/claude_desktop_config.json`
2. Add the same configuration (update paths for Windows)

## Step 5: Restart Claude Desktop

Completely quit and restart Claude Desktop.

## Step 6: Test It! (30 seconds)

Open Claude and try:

```
Check the Aave protocol status
```

If you see information about Aave V3 on Ethereum mainnet with a block number, it's working!

## What's Next?

Try these commands in Claude:

1. **See all available assets:**
   ```
   What assets are available on Aave V3?
   ```

2. **Check a specific address** (use any Ethereum address):
   ```
   Check the health factor for address 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
   ```

3. **Learn about liquidations:**
   ```
   Explain how Aave liquidations work using real data
   ```

## Troubleshooting

### "Server not found" error

- Make sure you restarted Claude Desktop completely
- Check that the path in claude_desktop_config.json is correct (use absolute path)
- Verify the build/ directory exists in your project folder

### "RPC error" or timeout

- Verify your RPC URL is correct in .env
- Check your internet connection
- Make sure you haven't exceeded Alchemy's rate limits (unlikely on free tier)

### "Address not found"

- Some addresses might not have any Aave positions
- Try a different address or check on Aave's website first

## Getting Addresses to Test

You can find addresses with Aave positions:

1. Visit https://app.aave.com/
2. Look at recent transactions on Etherscan for the Aave Pool contract
3. Check Dune Analytics dashboards for Aave
4. Ask Claude: "Can you suggest some ways to find addresses with Aave positions?"

## Need Help?

See the full README.md and EXAMPLE_USAGE.md for more detailed information and examples.
