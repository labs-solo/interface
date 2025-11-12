import { getInkTokenListCandidateUrls, shouldAutoloadInkTokenList } from 'uniswap/src/features/tokens/tokenLists/ink'

// Lists we use as fallbacks on chains that our backend doesn't support
const COINGECKO_AVAX_LIST = 'https://tokens.coingecko.com/avalanche/all.json'

const EXTRA_LISTS = shouldAutoloadInkTokenList() ? getInkTokenListCandidateUrls() : []

export const DEFAULT_INACTIVE_LIST_URLS: string[] = Array.from(new Set([COINGECKO_AVAX_LIST, ...EXTRA_LISTS]))
