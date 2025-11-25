#!/usr/bin/env node

/**
 * Aave Liquidation MCP Server
 * Provides tools for analyzing Aave V3 liquidation opportunities on Ethereum mainnet
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { AaveClient } from './aave-client.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const RPC_URL = process.env.ETHEREUM_RPC_URL;
if (!RPC_URL) {
  throw new Error('ETHEREUM_RPC_URL environment variable is required');
}

// Initialize Aave client
const aaveClient = new AaveClient(RPC_URL);

// Initialize MCP server
const server = new Server(
  {
    name: 'aave-liquidation-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_user_health',
        description:
          'Get health factor and account data for a specific Ethereum address on Aave V3. Returns collateral, debt, and liquidation status.',
        inputSchema: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'Ethereum address to check (must be a valid address)',
            },
          },
          required: ['address'],
        },
      },
      {
        name: 'analyze_liquidation',
        description:
          'Analyze a user position for liquidation opportunity. Returns detailed information including collateral assets, debt assets, risk level, and potential profit.',
        inputSchema: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'Ethereum address to analyze (must be a valid address)',
            },
          },
          required: ['address'],
        },
      },
      {
        name: 'get_user_positions',
        description:
          'Get detailed breakdown of a user collateral and debt positions across all Aave V3 assets.',
        inputSchema: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'Ethereum address to query',
            },
          },
          required: ['address'],
        },
      },
      {
        name: 'get_aave_reserves',
        description:
          'Get list of all available reserves (assets) in Aave V3 protocol with their configuration.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_asset_price',
        description:
          'Get current price for a specific asset from Aave oracle.',
        inputSchema: {
          type: 'object',
          properties: {
            assetAddress: {
              type: 'string',
              description: 'Token contract address',
            },
          },
          required: ['assetAddress'],
        },
      },
      {
        name: 'get_protocol_status',
        description:
          'Get general Aave V3 protocol status including current block number.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'batch_check_addresses',
        description:
          'Batch check multiple Ethereum addresses for liquidation opportunities. Returns a summary of all addresses with their health status.',
        inputSchema: {
          type: 'object',
          properties: {
            addresses: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of Ethereum addresses to check (max 20 addresses)',
            },
          },
          required: ['addresses'],
        },
      },
      {
        name: 'validate_address',
        description:
          'Validate if a string is a valid Ethereum address format.',
        inputSchema: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'Address string to validate',
            },
          },
          required: ['address'],
        },
      },
    ],
  };
});

/**
 * Handle tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_user_health': {
        const address = args?.address as string;
        if (!address || typeof address !== 'string') {
          throw new McpError(
            ErrorCode.InvalidParams,
            'address parameter is required and must be a string'
          );
        }

        if (!aaveClient.isValidAddress(address)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Invalid Ethereum address format'
          );
        }

        const accountData = await aaveClient.getUserAccountData(address);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  address: accountData.address,
                  healthFactor: accountData.healthFactorFormatted,
                  totalCollateralUSD: parseFloat(
                    ethers.formatUnits(accountData.totalCollateralBase, 8)
                  ).toFixed(2),
                  totalDebtUSD: parseFloat(
                    ethers.formatUnits(accountData.totalDebtBase, 8)
                  ).toFixed(2),
                  availableBorrowsUSD: parseFloat(
                    ethers.formatUnits(accountData.availableBorrowsBase, 8)
                  ).toFixed(2),
                  liquidationThreshold: parseFloat(
                    ethers.formatUnits(accountData.currentLiquidationThreshold, 4)
                  ).toFixed(2),
                  ltv: parseFloat(
                    ethers.formatUnits(accountData.ltv, 4)
                  ).toFixed(2),
                  isLiquidatable: accountData.isLiquidatable,
                  isAtRisk: accountData.isAtRisk,
                  status: accountData.isLiquidatable
                    ? 'LIQUIDATABLE'
                    : accountData.isAtRisk
                    ? 'AT_RISK'
                    : 'HEALTHY',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'analyze_liquidation': {
        const address = args?.address as string;
        if (!address || typeof address !== 'string') {
          throw new McpError(
            ErrorCode.InvalidParams,
            'address parameter is required and must be a string'
          );
        }

        if (!aaveClient.isValidAddress(address)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Invalid Ethereum address format'
          );
        }

        const opportunity = await aaveClient.analyzeLiquidationOpportunity(address);

        if (!opportunity) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    message: 'No liquidation opportunity found. Position is healthy.',
                    address,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(opportunity, null, 2),
            },
          ],
        };
      }

      case 'get_user_positions': {
        const address = args?.address as string;
        if (!address || typeof address !== 'string') {
          throw new McpError(
            ErrorCode.InvalidParams,
            'address parameter is required and must be a string'
          );
        }

        if (!aaveClient.isValidAddress(address)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Invalid Ethereum address format'
          );
        }

        const positions = await aaveClient.getUserReserves(address);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  address,
                  collateralPositions: positions.collateral,
                  debtPositions: positions.debt,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_aave_reserves': {
        const reserves = await aaveClient.getAllReserves();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  totalReserves: reserves.length,
                  reserves: reserves.map((r) => ({
                    symbol: r.symbol,
                    address: r.tokenAddress,
                    decimals: r.decimals,
                    ltv: (parseFloat(r.ltv.toString()) / 1e4).toFixed(2) + '%',
                    liquidationThreshold:
                      (parseFloat(r.liquidationThreshold.toString()) / 1e4).toFixed(2) + '%',
                    liquidationBonus:
                      (parseFloat(r.liquidationBonus.toString()) / 1e4 - 100).toFixed(2) + '%',
                    canBeCollateral: r.usageAsCollateralEnabled,
                    canBeBorrowed: r.borrowingEnabled,
                    isActive: r.isActive,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_asset_price': {
        const assetAddress = args?.assetAddress as string;
        if (!assetAddress || typeof assetAddress !== 'string') {
          throw new McpError(
            ErrorCode.InvalidParams,
            'assetAddress parameter is required and must be a string'
          );
        }

        if (!aaveClient.isValidAddress(assetAddress)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Invalid Ethereum address format'
          );
        }

        const price = await aaveClient.getAssetPrice(assetAddress);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  assetAddress,
                  priceUSD: price,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_protocol_status': {
        const blockNumber = await aaveClient.getBlockNumber();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  protocol: 'Aave V3',
                  network: 'Ethereum Mainnet',
                  blockNumber,
                  poolAddress: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
                  status: 'operational',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'batch_check_addresses': {
        const addresses = args?.addresses as string[];
        if (!Array.isArray(addresses) || addresses.length === 0) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'addresses parameter is required and must be a non-empty array'
          );
        }

        if (addresses.length > 20) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Maximum 20 addresses allowed per batch request'
          );
        }

        // Validate all addresses first
        const invalidAddresses = addresses.filter(
          (addr) => typeof addr !== 'string' || !aaveClient.isValidAddress(addr)
        );
        if (invalidAddresses.length > 0) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid Ethereum addresses: ${invalidAddresses.join(', ')}`
          );
        }

        const results = await aaveClient.batchAnalyzeLiquidation(addresses);

        // Calculate summary statistics
        let liquidatable = 0;
        let atRisk = 0;
        let healthy = 0;
        let failed = 0;

        const formattedResults = results.map((r) => {
          // Count statistics
          if (r.error) {
            failed++;
          } else if (r.opportunity?.riskLevel === 'HIGH') {
            liquidatable++;
          } else if (r.opportunity) {
            atRisk++;
          } else {
            healthy++;
          }

          return {
            address: r.address,
            status: r.error
              ? 'ERROR'
              : r.opportunity
              ? r.opportunity.riskLevel === 'HIGH'
                ? 'LIQUIDATABLE'
                : 'AT_RISK'
              : 'HEALTHY',
            healthFactor: r.opportunity?.healthFactor || 'N/A',
            totalDebtUSD: r.opportunity?.totalDebtUSD || '0',
            riskLevel: r.opportunity?.riskLevel || 'NONE',
            error: r.error,
          };
        });

        const summary = {
          totalChecked: addresses.length,
          successful: addresses.length - failed,
          failed,
          liquidatable,
          atRisk,
          healthy,
          results: formattedResults,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      }

      case 'validate_address': {
        const address = args?.address as string;
        if (!address || typeof address !== 'string') {
          throw new McpError(
            ErrorCode.InvalidParams,
            'address parameter is required and must be a string'
          );
        }

        const isValid = aaveClient.isValidAddress(address);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  address,
                  isValid,
                  message: isValid
                    ? 'Valid Ethereum address format'
                    : 'Invalid Ethereum address format',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Aave Liquidation MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
