/**
 * Type definitions for Aave Liquidation MCP
 */

export interface UserAccountData {
  address: string;
  totalCollateralBase: bigint;
  totalDebtBase: bigint;
  availableBorrowsBase: bigint;
  currentLiquidationThreshold: bigint;
  ltv: bigint;
  healthFactor: bigint;
  healthFactorFormatted: string;
  isLiquidatable: boolean;
  isAtRisk: boolean;
}

export interface UserReserveData {
  asset: string;
  symbol: string;
  currentATokenBalance: bigint;
  currentStableDebt: bigint;
  currentVariableDebt: bigint;
  usageAsCollateralEnabled: boolean;
  decimals: number;
  balanceFormatted: string;
  debtFormatted: string;
  liquidationBonus: bigint;
}

export interface ReserveData {
  symbol: string;
  tokenAddress: string;
  decimals: number;
  ltv: bigint;
  liquidationThreshold: bigint;
  liquidationBonus: bigint;
  usageAsCollateralEnabled: boolean;
  borrowingEnabled: boolean;
  isActive: boolean;
  price?: bigint;
  priceFormatted?: string;
}

export interface LiquidationOpportunity {
  userAddress: string;
  healthFactor: string;
  totalCollateralUSD: string;
  totalDebtUSD: string;
  availableBorrowsUSD: string;
  liquidationThreshold: string;
  collateralAssets: UserReserveData[];
  debtAssets: UserReserveData[];
  potentialProfit?: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  gasWarning?: string;
}

export interface Config {
  rpcUrl: string;
  healthFactorThreshold: number;
}

export interface BatchAnalysisResult {
  address: string;
  opportunity: LiquidationOpportunity | null;
  error?: string;
}
