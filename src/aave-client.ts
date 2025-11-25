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
  BatchAnalysisResult,
} from './types.js';

export class AaveClient {
  private provider: ethers.Provider;
  private poolContract: ethers.Contract;
  private dataProviderContract: ethers.Contract;
  private oracleContract: ethers.Contract;

  // Cache for reserves data (reduces RPC calls)
  private reserveCache: ReserveData[] | null = null;
  private reserveCacheTime: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute cache

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
   * Optimized with parallel queries for better performance
   */
  async getUserReserves(userAddress: string): Promise<{
    collateral: UserReserveData[];
    debt: UserReserveData[];
  }> {
    const reserves = await this.getAllReserves();
    const collateral: UserReserveData[] = [];
    const debt: UserReserveData[] = [];

    // Parallel query all user reserves
    const userReservePromises = reserves.map(reserve =>
      this.dataProviderContract.getUserReserveData(reserve.tokenAddress, userAddress)
    );
    const userReservesData = await Promise.all(userReservePromises);

    // Process results
    for (let i = 0; i < reserves.length; i++) {
      const reserve = reserves[i];
      const userReserve = userReservesData[i];
      const totalDebt = userReserve.currentStableDebt + userReserve.currentVariableDebt;

      if (userReserve.currentATokenBalance > 0n || totalDebt > 0n) {
        // Use cached decimals from reserves
        const decimals = reserve.decimals;

        const data: UserReserveData = {
          asset: reserve.tokenAddress,
          symbol: reserve.symbol,
          currentATokenBalance: userReserve.currentATokenBalance,
          currentStableDebt: userReserve.currentStableDebt,
          currentVariableDebt: userReserve.currentVariableDebt,
          usageAsCollateralEnabled: userReserve.usageAsCollateralEnabled,
          decimals,
          balanceFormatted: ethers.formatUnits(userReserve.currentATokenBalance, decimals),
          debtFormatted: ethers.formatUnits(totalDebt, decimals),
          liquidationBonus: reserve.liquidationBonus,
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
   * Optimized with caching and parallel queries
   */
  async getAllReserves(): Promise<ReserveData[]> {
    // Return cached data if still valid
    const now = Date.now();
    if (this.reserveCache && (now - this.reserveCacheTime) < this.CACHE_TTL) {
      return this.reserveCache;
    }

    const reserveTokens = await this.dataProviderContract.getAllReservesTokens();

    // Parallel query all configurations and decimals
    const configPromises = reserveTokens.map((reserve: { tokenAddress: string }) =>
      this.dataProviderContract.getReserveConfigurationData(reserve.tokenAddress)
    );
    const decimalsPromises = reserveTokens.map((reserve: { tokenAddress: string }) => {
      const tokenContract = new ethers.Contract(reserve.tokenAddress, ERC20_ABI, this.provider);
      return tokenContract.decimals();
    });

    const [configs, decimalsList] = await Promise.all([
      Promise.all(configPromises),
      Promise.all(decimalsPromises),
    ]);

    const reserves: ReserveData[] = reserveTokens.map(
      (reserve: { symbol: string; tokenAddress: string }, index: number) => ({
        symbol: reserve.symbol,
        tokenAddress: reserve.tokenAddress,
        decimals: Number(decimalsList[index]),
        ltv: configs[index].ltv,
        liquidationThreshold: configs[index].liquidationThreshold,
        liquidationBonus: configs[index].liquidationBonus,
        usageAsCollateralEnabled: configs[index].usageAsCollateralEnabled,
        borrowingEnabled: configs[index].borrowingEnabled,
        isActive: configs[index].isActive,
      })
    );

    // Update cache
    this.reserveCache = reserves;
    this.reserveCacheTime = now;

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
    if (hf < LIQUIDATION_THRESHOLD) {
      riskLevel = 'HIGH';
    } else if (hf < 1.02) {
      riskLevel = 'MEDIUM';
    } else {
      // 1.02 <= hf < WARNING_THRESHOLD (1.05)
      riskLevel = 'LOW';
    }

    // Format values in USD (base is already in USD with 8 decimals from oracle)
    const totalCollateralUSD = ethers.formatUnits(accountData.totalCollateralBase, 8);
    const totalDebtUSD = ethers.formatUnits(accountData.totalDebtBase, 8);
    const availableBorrowsUSD = ethers.formatUnits(accountData.availableBorrowsBase, 8);

    // Calculate potential profit with actual liquidation bonus
    let potentialProfit = '0';
    if (accountData.isLiquidatable) {
      const debtValue = parseFloat(totalDebtUSD);

      // Close factor: can liquidate up to 50% of debt
      const maxDebtByCloseFactor = debtValue * 0.5;

      // Fetch prices for collateral assets to avoid overstating profit
      const priceMap = collateral.length
        ? await this.getAssetsPrices(collateral.map((c) => c.asset))
        : new Map<string, string>();

      let bestEstimatedProfit = 0;

      for (const c of collateral) {
        const priceStr = priceMap.get(c.asset);
        const price = priceStr ? parseFloat(priceStr) : 0;
        if (!price) {
          continue;
        }

        // Convert collateral balance to USD using token decimals and oracle price (8 decimals)
        const collateralAmount = parseFloat(ethers.formatUnits(c.currentATokenBalance, c.decimals));
        const collateralValueUSD = collateralAmount * price;

        // liquidationBonus is in bps, e.g. 10500 => 5% bonus
        const bonusPercentage = Math.max(0, Number(c.liquidationBonus) - 10000) / 10000;
        if (bonusPercentage <= 0) {
          continue;
        }

        // Debt that can be covered by this collateral considering bonus
        const maxDebtByCollateral = collateralValueUSD / (1 + bonusPercentage);

        // Actual liquidatable debt for this collateral
        const liquidatableDebt = Math.min(maxDebtByCloseFactor, maxDebtByCollateral, debtValue);
        const estimatedProfit = liquidatableDebt * bonusPercentage;

        if (estimatedProfit > bestEstimatedProfit) {
          bestEstimatedProfit = estimatedProfit;
        }
      }

      potentialProfit = bestEstimatedProfit.toFixed(2);
    }

    return {
      userAddress,
      healthFactor: accountData.healthFactorFormatted,
      totalCollateralUSD,
      totalDebtUSD,
      availableBorrowsUSD,
      liquidationThreshold: parseFloat(
        ethers.formatUnits(accountData.currentLiquidationThreshold, 4)
      ),
      collateralAssets: collateral,
      debtAssets: debt,
      potentialProfit,
      riskLevel,
      gasWarning: 'Profit calculation does not include Gas costs. Actual profit will be lower.',
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
  ): Promise<BatchAnalysisResult[]> {
    const results: BatchAnalysisResult[] = new Array(addresses.length);
    const concurrency = Math.min(5, addresses.length);
    let currentIndex = 0;

    const worker = async () => {
      while (true) {
        const idx = currentIndex++;
        if (idx >= addresses.length) {
          break;
        }

        const address = addresses[idx];
        try {
          const opportunity = await this.analyzeLiquidationOpportunity(address);
          results[idx] = { address, opportunity };
        } catch (error) {
          results[idx] = {
            address,
            opportunity: null,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    return results;
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

      const { aTokenAddress, variableDebtTokenAddress, stableDebtTokenAddress } =
        await this.dataProviderContract.getReserveTokensAddresses(assetAddress);

      const aTokenContract = new ethers.Contract(aTokenAddress, ERC20_ABI, this.provider);
      const totalSupply = await aTokenContract.totalSupply();

      const reserveData = await this.dataProviderContract.getReserveData(assetAddress);

      // Calculate total borrow (stable + variable)
      const totalStableDebt = reserveData.totalStableDebt;
      const totalVariableDebt = reserveData.totalVariableDebt;
      const totalBorrow = totalStableDebt + totalVariableDebt;

      // Calculate utilization rate
      const totalSupplyVal = parseFloat(ethers.formatUnits(totalSupply, reserve.decimals));
      const totalBorrowVal = parseFloat(ethers.formatUnits(totalBorrow, reserve.decimals));

      let utilizationRate = '0';
      if (totalSupplyVal > 0) {
        utilizationRate = (totalBorrowVal / totalSupplyVal).toFixed(4);
      }

      // APYs are in ray (1e27); keep as decimal fractions (e.g. 0.05 for 5%)
      const supplyAPY = parseFloat(ethers.formatUnits(reserveData.liquidityRate, 27)).toFixed(4);
      const borrowAPY = parseFloat(ethers.formatUnits(reserveData.variableBorrowRate, 27)).toFixed(4);

      return {
        symbol: reserve.symbol,
        totalSupply: ethers.formatUnits(totalSupply, reserve.decimals),
        totalBorrow: ethers.formatUnits(totalBorrow, reserve.decimals),
        utilizationRate,
        supplyAPY,
        borrowAPY,
      };
    } catch (error) {
      return null;
    }
  }
}
