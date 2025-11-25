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
      const totalCollateralValue = parseFloat(totalCollateralUSD);

      // Find the collateral asset with the highest liquidation bonus
      // In a real liquidation, the liquidator chooses which collateral to seize
      let maxBonus = 0;
      if (collateral.length > 0) {
        // liquidationBonus is in basis points (e.g., 10500 for 5% bonus)
        // We need to subtract 10000 to get the bonus part
        maxBonus = Math.max(...collateral.map(c => Number(c.liquidationBonus) - 10000));
      }

      // If no collateral or bonus < 0 (shouldn't happen), assume 0
      const bonusPercentage = maxBonus > 0 ? maxBonus / 10000 : 0;

      // Calculate maximum liquidatable debt considering both close factor and available collateral
      // Close factor: Can liquidate up to 50% of debt
      const maxDebtByCloseFactor = debtValue * 0.5;

      // Collateral constraint: Need enough collateral to cover debt + bonus
      // If liquidator pays D debt, they receive D * (1 + bonus) collateral
      // So max debt they can liquidate is: totalCollateral / (1 + bonus)
      const maxDebtByCollateral = bonusPercentage > 0
        ? totalCollateralValue / (1 + bonusPercentage)
        : totalCollateralValue;

      // Actual liquidatable debt is the smaller of the two constraints
      const actualLiquidatableDebt = Math.min(maxDebtByCloseFactor, maxDebtByCollateral);

      // Profit = liquidatable debt * bonus percentage
      const estimatedBonus = actualLiquidatableDebt * bonusPercentage;
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
    const results = await Promise.allSettled(
      addresses.map(async (address) => ({
        address,
        opportunity: await this.analyzeLiquidationOpportunity(address),
      }))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Return error information for failed addresses
        return {
          address: addresses[index],
          opportunity: null,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        };
      }
    });
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

      let utilizationRate = '0%';
      if (totalSupplyVal > 0) {
        utilizationRate = ((totalBorrowVal / totalSupplyVal) * 100).toFixed(2) + '%';
      }

      // APYs are in ray (1e27)
      const supplyAPY = (parseFloat(ethers.formatUnits(reserveData.liquidityRate, 27)) * 100).toFixed(2) + '%';
      const borrowAPY = (parseFloat(ethers.formatUnits(reserveData.variableBorrowRate, 27)) * 100).toFixed(2) + '%';

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
