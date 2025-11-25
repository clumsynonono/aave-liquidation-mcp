/**
 * Aave V3 Client for fetching protocol data
 */

import { ethers } from 'ethers';
import {
  AAVE_V3_POOL_ADDRESS,
  AAVE_V3_POOL_DATA_PROVIDER,
  AAVE_V3_ORACLE,
  AAVE_POOL_ABI,
  AAVE_DATA_PROVIDER_ABI,
  AAVE_ORACLE_ABI,
  ERC20_ABI,
  LIQUIDATION_THRESHOLD,
  WARNING_THRESHOLD,
} from './constants.js';
import {
  UserAccountData,
  UserReserveData,
  ReserveData,
  LiquidationOpportunity,
} from './types.js';

export class AaveClient {
  private provider: ethers.Provider;
  private poolContract: ethers.Contract;
  private dataProviderContract: ethers.Contract;
  private oracleContract: ethers.Contract;

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.poolContract = new ethers.Contract(
      AAVE_V3_POOL_ADDRESS,
      AAVE_POOL_ABI,
      this.provider
    );
    this.dataProviderContract = new ethers.Contract(
      AAVE_V3_POOL_DATA_PROVIDER,
      AAVE_DATA_PROVIDER_ABI,
      this.provider
    );
    this.oracleContract = new ethers.Contract(
      AAVE_V3_ORACLE,
      AAVE_ORACLE_ABI,
      this.provider
    );
  }

  /**
   * Get user account data including health factor
   */
  async getUserAccountData(userAddress: string): Promise<UserAccountData> {
    const data = await this.poolContract.getUserAccountData(userAddress);

    const healthFactorFormatted = ethers.formatUnits(data.healthFactor, 18);
    const healthFactorNumber = parseFloat(healthFactorFormatted);

    return {
      address: userAddress,
      totalCollateralBase: data.totalCollateralBase,
      totalDebtBase: data.totalDebtBase,
      availableBorrowsBase: data.availableBorrowsBase,
      currentLiquidationThreshold: data.currentLiquidationThreshold,
      ltv: data.ltv,
      healthFactor: data.healthFactor,
      healthFactorFormatted,
      isLiquidatable: healthFactorNumber < LIQUIDATION_THRESHOLD && healthFactorNumber > 0,
      isAtRisk: healthFactorNumber < WARNING_THRESHOLD && healthFactorNumber > 0,
    };
  }

  /**
   * Get user reserves (collateral and debt positions)
   */
  async getUserReserves(userAddress: string): Promise<{
    collateral: UserReserveData[];
    debt: UserReserveData[];
  }> {
    const reserves = await this.getAllReserves();
    const collateral: UserReserveData[] = [];
    const debt: UserReserveData[] = [];

    for (const reserve of reserves) {
      const userReserve = await this.dataProviderContract.getUserReserveData(
        reserve.tokenAddress,
        userAddress
      );

      const totalDebt = userReserve.currentStableDebt + userReserve.currentVariableDebt;

      if (userReserve.currentATokenBalance > 0n || totalDebt > 0n) {
        const tokenContract = new ethers.Contract(
          reserve.tokenAddress,
          ERC20_ABI,
          this.provider
        );
        const decimals = await tokenContract.decimals();

        const data: UserReserveData = {
          asset: reserve.tokenAddress,
          symbol: reserve.symbol,
          currentATokenBalance: userReserve.currentATokenBalance,
          currentStableDebt: userReserve.currentStableDebt,
          currentVariableDebt: userReserve.currentVariableDebt,
          usageAsCollateralEnabled: userReserve.usageAsCollateralEnabled,
          balanceFormatted: ethers.formatUnits(userReserve.currentATokenBalance, decimals),
          debtFormatted: ethers.formatUnits(totalDebt, decimals),
        };

        if (userReserve.currentATokenBalance > 0n) {
          collateral.push(data);
        }
        if (totalDebt > 0n) {
          debt.push(data);
        }
      }
    }

    return { collateral, debt };
  }

  /**
   * Get all available reserves in Aave V3
   */
  async getAllReserves(): Promise<ReserveData[]> {
    const reserveTokens = await this.dataProviderContract.getAllReservesTokens();
    const reserves: ReserveData[] = [];

    for (const reserve of reserveTokens) {
      const config = await this.dataProviderContract.getReserveConfigurationData(
        reserve.tokenAddress
      );

      const tokenContract = new ethers.Contract(
        reserve.tokenAddress,
        ERC20_ABI,
        this.provider
      );
      const decimals = await tokenContract.decimals();

      reserves.push({
        symbol: reserve.symbol,
        tokenAddress: reserve.tokenAddress,
        decimals: Number(decimals),
        ltv: config.ltv,
        liquidationThreshold: config.liquidationThreshold,
        liquidationBonus: config.liquidationBonus,
        usageAsCollateralEnabled: config.usageAsCollateralEnabled,
        borrowingEnabled: config.borrowingEnabled,
        isActive: config.isActive,
      });
    }

    return reserves;
  }

  /**
   * Get asset price from Aave oracle
   */
  async getAssetPrice(assetAddress: string): Promise<string> {
    const price = await this.oracleContract.getAssetPrice(assetAddress);
    // Oracle returns price with 8 decimals
    return ethers.formatUnits(price, 8);
  }

  /**
   * Get prices for multiple assets
   */
  async getAssetsPrices(assetAddresses: string[]): Promise<Map<string, string>> {
    const prices = await this.oracleContract.getAssetsPrices(assetAddresses);
    const priceMap = new Map<string, string>();

    for (let i = 0; i < assetAddresses.length; i++) {
      priceMap.set(assetAddresses[i], ethers.formatUnits(prices[i], 8));
    }

    return priceMap;
  }

  /**
   * Analyze a user position for liquidation opportunity
   */
  async analyzeLiquidationOpportunity(
    userAddress: string
  ): Promise<LiquidationOpportunity | null> {
    const accountData = await this.getUserAccountData(userAddress);

    // Only return if liquidatable or at risk
    if (!accountData.isLiquidatable && !accountData.isAtRisk) {
      return null;
    }

    const { collateral, debt } = await this.getUserReserves(userAddress);

    // Calculate risk level
    const hf = parseFloat(accountData.healthFactorFormatted);
    let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    if (hf < 1.0) {
      riskLevel = 'HIGH';
    } else if (hf < 1.02) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    // Format values in USD (base is already in USD with 8 decimals from oracle)
    const totalCollateralUSD = ethers.formatUnits(accountData.totalCollateralBase, 8);
    const totalDebtUSD = ethers.formatUnits(accountData.totalDebtBase, 8);
    const availableBorrowsUSD = ethers.formatUnits(accountData.availableBorrowsBase, 8);

    // Calculate potential profit (simplified: liquidation bonus is typically 5-10%)
    let potentialProfit = '0';
    if (accountData.isLiquidatable) {
      const debtValue = parseFloat(totalDebtUSD);
      const estimatedBonus = debtValue * 0.05; // Assume 5% liquidation bonus
      potentialProfit = estimatedBonus.toFixed(2);
    }

    return {
      userAddress,
      healthFactor: accountData.healthFactorFormatted,
      totalCollateralUSD,
      totalDebtUSD,
      availableBorrowsUSD,
      liquidationThreshold: ethers.formatUnits(accountData.currentLiquidationThreshold, 4),
      collateralAssets: collateral,
      debtAssets: debt,
      potentialProfit,
      riskLevel,
    };
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  /**
   * Batch analyze multiple addresses for liquidation opportunities
   */
  async batchAnalyzeLiquidation(
    addresses: string[]
  ): Promise<{ address: string; opportunity: LiquidationOpportunity | null }[]> {
    const results = await Promise.allSettled(
      addresses.map(async (address) => ({
        address,
        opportunity: await this.analyzeLiquidationOpportunity(address),
      }))
    );

    return results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<any>).value);
  }

  /**
   * Validate Ethereum address format
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Get reserve statistics including total supply and borrow
   */
  async getReserveStats(assetAddress: string): Promise<{
    symbol: string;
    totalSupply: string;
    totalBorrow: string;
    utilizationRate: string;
    supplyAPY: string;
    borrowAPY: string;
  } | null> {
    try {
      const reserves = await this.getAllReserves();
      const reserve = reserves.find((r) => r.tokenAddress.toLowerCase() === assetAddress.toLowerCase());

      if (!reserve) {
        return null;
      }

      const { aTokenAddress } = await this.dataProviderContract.getReserveTokensAddresses(assetAddress);
      const aTokenContract = new ethers.Contract(aTokenAddress, ERC20_ABI, this.provider);
      const totalSupply = await aTokenContract.balanceOf(aTokenAddress);

      return {
        symbol: reserve.symbol,
        totalSupply: ethers.formatUnits(totalSupply, reserve.decimals),
        totalBorrow: '0', // Would need additional contract calls
        utilizationRate: '0%',
        supplyAPY: '0%',
        borrowAPY: '0%',
      };
    } catch (error) {
      return null;
    }
  }
}
