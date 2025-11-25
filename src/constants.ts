/**
 * Aave V3 Protocol Constants for Ethereum Mainnet
 */

export const AAVE_V3_POOL_ADDRESS = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';
export const AAVE_V3_POOL_DATA_PROVIDER = '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3';
export const AAVE_V3_ORACLE = '0x54586bE62E3c3580375aE3723C145253060Ca0C2';

/**
 * Minimal ABI for Aave V3 Pool contract
 */
export const AAVE_POOL_ABI = [
  'function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
  'function getReservesList() external view returns (address[])',
];

/**
 * Minimal ABI for Aave V3 Pool Data Provider contract
 */
export const AAVE_DATA_PROVIDER_ABI = [
  'function getUserReserveData(address asset, address user) external view returns (uint256 currentATokenBalance, uint256 currentStableDebt, uint256 currentVariableDebt, uint256 principalStableDebt, uint256 scaledVariableDebt, uint256 stableBorrowRate, uint256 liquidityRate, uint40 stableRateLastUpdated, bool usageAsCollateralEnabled)',
  'function getReserveConfigurationData(address asset) external view returns (uint256 decimals, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen)',
  'function getAllReservesTokens() external view returns (tuple(string symbol, address tokenAddress)[])',
  'function getReserveTokensAddresses(address asset) external view returns (address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress)',
];

/**
 * Minimal ABI for Aave V3 Oracle contract
 */
export const AAVE_ORACLE_ABI = [
  'function getAssetPrice(address asset) external view returns (uint256)',
  'function getAssetsPrices(address[] calldata assets) external view returns (uint256[])',
];

/**
 * ERC20 ABI for token operations
 */
export const ERC20_ABI = [
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
];

/**
 * Health factor threshold for liquidation eligibility
 * Positions with health factor < 1.0 can be liquidated
 */
export const LIQUIDATION_THRESHOLD = 1.0;

/**
 * Health factor warning threshold
 * Positions with health factor < this value are at risk
 */
export const WARNING_THRESHOLD = 1.05;
