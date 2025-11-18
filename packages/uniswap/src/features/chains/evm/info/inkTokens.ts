import { Token } from '@uniswap/sdk-core'
import { config } from 'uniswap/src/config'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { buildUSDC } from 'uniswap/src/features/tokens/stablecoin'

const DEFAULT_INK_USDC_ADDRESS = '0x2D270e6886d130D724215A266106e6832161EAEd'

export const INK_USDC_ADDRESS = config.inkStablecoinAddress || DEFAULT_INK_USDC_ADDRESS

export const USDC_INK = buildUSDC(INK_USDC_ADDRESS, UniverseChainId.Ink)

export const USDCE_INK = new Token(
  UniverseChainId.Ink,
  '0xF1815bd50389c46847f0Bda824eC8da914045D14',
  6,
  'USDC.e',
  'USD Coin (Bridged)',
)

export const USDT0_INK = new Token(
  UniverseChainId.Ink,
  '0x0200C29006150606B650577BBE7B6248F58470c1',
  6,
  'USDT0',
  'Tether USD Zero',
)

export const OUSDT_INK = new Token(
  UniverseChainId.Ink,
  '0x1217BfE6c773EEC6cc4A38b5Dc45B92292B6E189',
  6,
  'oUSDT',
  'Optimism Tether USD',
)

export const FRXUSD_INK = new Token(
  UniverseChainId.Ink,
  '0x80Eede496655FB9047dd39d9f418d5483ED600df',
  18,
  'frxUSD',
  'Frax USD',
)

export const VELO_INK = new Token(
  UniverseChainId.Ink,
  '0x7f9AdFbd38b669F03d1d11000Bc76b9AaEA28A81',
  18,
  'VELO',
  'Velodrome',
)

export const OP_INK = new Token(UniverseChainId.Ink, '0xafcc6AE807187A31E84138F3860D4CE27973e01b', 18, 'OP', 'Optimism')

export const ANITA_INK = new Token(
  UniverseChainId.Ink,
  '0x0606FC632ee812bA970af72F8489baAa443C4B98',
  18,
  'ANITA',
  'ANITA',
)

export const KBTC_INK = new Token(
  UniverseChainId.Ink,
  '0x73E0C0d45E048D25Fc26Fa3159b0aA04BfA4Db98',
  8,
  'kBTC',
  'Kraken Bitcoin',
)
