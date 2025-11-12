import { GraphQLApi } from '@universe/api'
import { ETH_LOGO, ETHEREUM_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { FRXUSD_INK, OUSDT_INK, USDCE_INK, USDT0_INK } from 'uniswap/src/constants/tokens'
import {
  DEFAULT_MS_BEFORE_WARNING,
  DEFAULT_NATIVE_ADDRESS_LEGACY,
  DEFAULT_RETRY_OPTIONS,
  getPlaywrightRpcUrls,
} from 'uniswap/src/features/chains/evm/rpc'
import { buildChainTokens } from 'uniswap/src/features/chains/evm/tokens'
import { GENERIC_L2_GAS_CONFIG } from 'uniswap/src/features/chains/gasDefaults'
import {
  GqlChainId,
  NetworkLayer,
  RPCType,
  UniverseChainId,
  UniverseChainInfo,
} from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { buildUSDC } from 'uniswap/src/features/tokens/stablecoin'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { isWebApp } from 'utilities/src/platform'

const LOCAL_INK_PLAYWRIGHT_RPC_URL = 'http://127.0.0.1:8548'
const PRIMARY_INK_RPC_URL = config.inkRpcPrimary || 'https://rpc.kraken.com/ink'
const FALLBACK_INK_RPC_URL = config.inkRpcFallback || ''
const INK_USDC_ADDRESS = config.inkStablecoinAddress || '0x2D270e6886d130D724215A266106e6832161EAEd'

const tokens = buildChainTokens({
  stables: {
    USDC: buildUSDC(INK_USDC_ADDRESS, UniverseChainId.Ink),
    USDCe: USDCE_INK,
    USDT0: USDT0_INK,
    OUSDT: OUSDT_INK,
    FRXUSD: FRXUSD_INK,
  },
})

const rpcUrls = isPlaywrightEnv()
  ? getPlaywrightRpcUrls(LOCAL_INK_PLAYWRIGHT_RPC_URL)
  : {
      [RPCType.Public]: { http: [PRIMARY_INK_RPC_URL] },
      [RPCType.Default]: { http: [PRIMARY_INK_RPC_URL] },
      [RPCType.Interface]: { http: [PRIMARY_INK_RPC_URL] },
      ...(FALLBACK_INK_RPC_URL ? { [RPCType.Fallback]: { http: [FALLBACK_INK_RPC_URL] } } : {}),
    }

const defaultPoolHook = config.inkDefaultPoolHookAddress
  ? {
      label: 'AEGIS Dynamic Fee Manager',
      address: config.inkDefaultPoolHookAddress,
      type: 'dynamic-fee',
    }
  : undefined

export const INK_CHAIN_INFO = {
  id: UniverseChainId.Ink,
  name: 'INK',
  platform: Platform.EVM,
  assetRepoNetworkName: 'ink',
  backendChain: {
    chain: GraphQLApi.Chain.Ink as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 6,
  blockWaitMsBeforeWarning: isWebApp ? DEFAULT_MS_BEFORE_WARNING * 2 : DEFAULT_MS_BEFORE_WARNING,
  docs: 'https://docs.ink/',
  elementName: ElementName.ChainInk,
  explorer: {
    name: 'InkScan',
    url: 'https://inkscan.kraken.com/',
    apiURL: 'https://inkscan.kraken.com/api',
  },
  interfaceName: 'ink',
  label: 'INK',
  logo: ETHEREUM_LOGO,
  nativeCurrency: {
    name: 'Ink ETH',
    symbol: 'INK',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETH_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  testnet: false,
  pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
  rpcUrls,
  tokens,
  supportsV4: true,
  defaultPoolHook,
  urlParam: 'ink',
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
  gasConfig: GENERIC_L2_GAS_CONFIG,
  tradingApiPollingIntervalMs: 250,
} as const satisfies UniverseChainInfo
