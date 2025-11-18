import type { TokenInfo, TokenList as TokenListSchema } from '@uniswap/token-lists'
import { GraphQLApi } from '@universe/api'
import { config } from 'uniswap/src/config'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo, TokenList as TokenListSafety } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { uriToHttpUrls } from 'utilities/src/format/urls'
import { logger } from 'utilities/src/logger/logger'

export const INK_TOKEN_LIST_DEFAULT_PATH = '/tokenlists/ink.velodrome.json'

const TOKEN_LIST_KEYWORDS = ['ink', 'velodrome', 'uniswap']
const TOKEN_LIST_TIMESTAMP = '2025-01-13T00:00:00.000Z'
const DEFAULT_LOGO_URI = 'https://assets.coingecko.com/coins/images/12538/standard/Logo_200x_200.png?1696512350'

const ANITA_DATA_URI =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmNDcyYjYiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzkzMzNlYSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiByeD0iMjgiIGZpbGw9InVybCgjZykiIC8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJJbnRlciwgQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNTYiIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IiNmZmZmZmYiPkE8L3RleHQ+Cjwvc3ZnPg=='

const LIST_TAGS = {
  'velodrome-core': {
    name: 'Velodrome Core',
    description: 'Tokens curated by Velodrome for Ink.',
  },
  stablecoin: {
    name: 'Stablecoin',
    description: 'USD-pegged assets supported on Ink.',
  },
  governance: {
    name: 'Governance',
    description: 'Network and protocol governance assets.',
  },
  synthetic: {
    name: 'Synthetic Asset',
    description: 'Tokens that track external asset prices.',
  },
  community: {
    name: 'Community',
    description: 'Community and ecosystem partners on Ink.',
  },
} as const

const TOKEN_INFOS: TokenInfo[] = [
  {
    chainId: UniverseChainId.Ink,
    address: '0x4200000000000000000000000000000000000006',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/2518/standard/weth.png?1696502918',
    tags: ['velodrome-core'],
  },
  {
    chainId: UniverseChainId.Ink,
    address: '0x7f9AdFbd38b669F03d1d11000Bc76b9AaEA28A81',
    name: 'Velodrome',
    symbol: 'VELO',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/12538/standard/Logo_200x_200.png?1696512350',
    tags: ['velodrome-core'],
  },
  {
    chainId: UniverseChainId.Ink,
    address: '0x2D270e6886d130D724215A266106e6832161EAEd',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/standard/USD_Coin_icon.png?1696506694',
    tags: ['velodrome-core', 'stablecoin'],
  },
  {
    chainId: UniverseChainId.Ink,
    address: '0xafcc6AE807187A31E84138F3860D4CE27973e01b',
    name: 'Optimism',
    symbol: 'OP',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/25244/standard/optimism.png?1696524380',
    tags: ['velodrome-core', 'governance'],
  },
  {
    chainId: UniverseChainId.Ink,
    address: '0xF1815bd50389c46847f0Bda824eC8da914045D14',
    name: 'USD Coin (Bridged)',
    symbol: 'USDC.e',
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/standard/USD_Coin_icon.png?1696506694',
    tags: ['velodrome-core', 'stablecoin'],
  },
  {
    chainId: UniverseChainId.Ink,
    address: '0x0200C29006150606B650577BBE7B6248F58470c1',
    name: 'Tether USD Zero',
    symbol: 'USDT0',
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png?1696501661',
    tags: ['velodrome-core', 'stablecoin'],
  },
  {
    chainId: UniverseChainId.Ink,
    address: '0x1217BfE6c773EEC6cc4A38b5Dc45B92292B6E189',
    name: 'Optimism Tether USD',
    symbol: 'oUSDT',
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png?1696501661',
    tags: ['velodrome-core', 'stablecoin'],
  },
  {
    chainId: UniverseChainId.Ink,
    address: '0x80Eede496655FB9047dd39d9f418d5483ED600df',
    name: 'Frax USD',
    symbol: 'frxUSD',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/28286/standard/wfrxUSD.png?1696526761',
    tags: ['velodrome-core', 'stablecoin'],
  },
  {
    chainId: UniverseChainId.Ink,
    address: '0x0606FC632ee812bA970af72F8489baAa443C4B98',
    name: 'ANITA',
    symbol: 'ANITA',
    decimals: 18,
    logoURI: ANITA_DATA_URI,
    tags: ['velodrome-core', 'community'],
  },
  {
    chainId: UniverseChainId.Ink,
    address: '0x73E0C0d45E048D25Fc26Fa3159b0aA04BfA4Db98',
    name: 'Kraken Bitcoin',
    symbol: 'kBTC',
    decimals: 8,
    logoURI: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579',
    tags: ['velodrome-core', 'synthetic'],
  },
] satisfies TokenInfo[]

export const INK_VELODROME_TOKEN_LIST: TokenListSchema = {
  name: 'Ink Velodrome Core',
  timestamp: TOKEN_LIST_TIMESTAMP,
  version: { major: 1, minor: 0, patch: 0 },
  logoURI: DEFAULT_LOGO_URI,
  keywords: TOKEN_LIST_KEYWORDS,
  tags: LIST_TAGS,
  tokens: TOKEN_INFOS,
}

const DEFAULT_SAFETY_INFO = {
  tokenList: TokenListSafety.Default,
  protectionResult: GraphQLApi.ProtectionResult.Unknown,
} as const

const parsedTokenListChainIds = parseTokenListDefaultChainIds(config.tokenListDefaultChainIds)

let cachedTokenList: TokenListSchema | undefined
let inflightTokenList: Promise<TokenListSchema> | undefined

export function parseTokenListDefaultChainIds(rawValue?: string): UniverseChainId[] {
  if (!rawValue) {
    return []
  }

  return rawValue
    .split(',')
    .map((piece) => piece.trim())
    .filter(Boolean)
    .map((piece) => Number(piece))
    .filter((id): id is UniverseChainId => Number.isInteger(id) && isUniverseChainId(id))
}

export function shouldAutoloadInkTokenList(): boolean {
  return parsedTokenListChainIds.includes(UniverseChainId.Ink)
}

export function getInkTokenListCandidateUrls(): string[] {
  const urls = [config.inkTokenListUrl, config.inkTokenListFallbackUrl, INK_TOKEN_LIST_DEFAULT_PATH].filter(
    (value): value is string => Boolean(value),
  )

  return Array.from(new Set(urls))
}

async function fetchTokenListFromUrl(candidate: string): Promise<TokenListSchema | null> {
  const urls = uriToHttpUrls(candidate, { allowLocalUri: true })

  for (const url of urls) {
    try {
      const response = await fetch(url, { credentials: 'omit' })
      if (!response.ok) {
        logger.debug('inkTokenList', 'fetchTokenListFromUrl', 'Non-ok response', { status: response.status, url })
        continue
      }

      const json = (await response.json()) as TokenListSchema
      return json
    } catch (error) {
      logger.debug('inkTokenList', 'fetchTokenListFromUrl', 'Failed to fetch candidate', { candidate: url, error })
    }
  }

  return null
}

async function fetchInkTokenListFromNetwork(): Promise<TokenListSchema> {
  const candidates = getInkTokenListCandidateUrls()

  for (const candidate of candidates) {
    const list = await fetchTokenListFromUrl(candidate)
    if (list) {
      return list
    }
  }

  throw new Error('Unable to download Ink token list from configured URLs.')
}

export async function loadInkTokenList(): Promise<TokenListSchema> {
  if (cachedTokenList) {
    return cachedTokenList
  }

  if (!inflightTokenList) {
    inflightTokenList = (async (): Promise<TokenListSchema> => {
      try {
        return await fetchInkTokenListFromNetwork()
      } catch (error) {
        logger.warn('inkTokenList', 'loadInkTokenList', 'Falling back to bundled token list', error)
        return INK_VELODROME_TOKEN_LIST
      }
    })()
  }

  const result = await inflightTokenList
  cachedTokenList = result
  inflightTokenList = undefined
  return result
}

function matchesQuery(token: TokenInfo, query?: string): boolean {
  if (!query) {
    return true
  }

  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return true
  }

  const address = token.address.toLowerCase()
  return (
    token.symbol.toLowerCase().includes(normalizedQuery) ||
    token.name.toLowerCase().includes(normalizedQuery) ||
    address === normalizedQuery ||
    address.includes(normalizedQuery.replace(/^0x/, ''))
  )
}

function tokenInfoToCurrencyInfo(token: TokenInfo): CurrencyInfo | undefined {
  if (token.chainId !== UniverseChainId.Ink) {
    return undefined
  }

  const currency = buildCurrency({
    chainId: UniverseChainId.Ink,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name,
  })

  if (!currency) {
    return undefined
  }

  return buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl: token.logoURI ?? null,
    safetyInfo: DEFAULT_SAFETY_INFO,
    isSpam: false,
  })
}

function mergeCurrencyInfos(currencyInfos: CurrencyInfo[] | undefined): CurrencyInfo[] {
  if (!currencyInfos) {
    return []
  }

  const seen = new Set<string>()
  const ordered: CurrencyInfo[] = []

  currencyInfos.forEach((info) => {
    if (!seen.has(info.currencyId)) {
      seen.add(info.currencyId)
      ordered.push(info)
    }
  })

  return ordered
}

export async function getInkCurrencyInfos(searchQuery?: string): Promise<CurrencyInfo[]> {
  const list = await loadInkTokenList()
  const filteredTokens = list.tokens.filter((token) => matchesQuery(token, searchQuery))
  const currencyInfos = filteredTokens
    .map((token) => tokenInfoToCurrencyInfo(token))
    .filter((token): token is CurrencyInfo => Boolean(token))

  return mergeCurrencyInfos(currencyInfos)
}

export async function getAllInkCurrencyInfos(): Promise<CurrencyInfo[]> {
  return getInkCurrencyInfos()
}
