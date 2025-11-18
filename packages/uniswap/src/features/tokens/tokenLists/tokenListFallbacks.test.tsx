import { useTrendingTokensCurrencyInfos } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensCurrencyInfos'
import { useSearchTokensAndPoolsQuery } from 'uniswap/src/data/rest/searchTokensAndPools'
import { useTokenRankingsQuery } from 'uniswap/src/data/rest/tokenRankings'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import { renderHook, waitFor } from 'uniswap/src/test/test-utils'

jest.mock('uniswap/src/data/rest/searchTokensAndPools', () => ({
  ...jest.requireActual('uniswap/src/data/rest/searchTokensAndPools'),
  useSearchTokensAndPoolsQuery: jest.fn(),
}))

jest.mock('uniswap/src/data/rest/tokenRankings', () => ({
  ...jest.requireActual('uniswap/src/data/rest/tokenRankings'),
  useTokenRankingsQuery: jest.fn(),
}))

const mockUseSearchTokensAndPoolsQuery = jest.mocked(useSearchTokensAndPoolsQuery)
const mockUseTokenRankingsQuery = jest.mocked(useTokenRankingsQuery)

describe('Ink token list fallbacks', () => {
  const originalFetch = global.fetch

  beforeAll(() => {
    global.fetch = jest.fn(() => Promise.reject(new Error('network disabled'))) as unknown as typeof fetch
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  beforeEach(() => {
    mockUseSearchTokensAndPoolsQuery.mockReset()
    mockUseTokenRankingsQuery.mockReset()
  })

  it('populates useSearchTokens results when the search API returns nothing', async () => {
    mockUseSearchTokensAndPoolsQuery.mockReturnValue({
      data: undefined,
      error: undefined,
      isPending: false,
      refetch: jest.fn(),
    } as any)

    const { result } = renderHook(() =>
      useSearchTokens({
        searchQuery: 'velo',
        chainFilter: UniverseChainId.Ink,
        skip: false,
      }),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    const symbols = result.current.data?.map((currency) => currency.currency.symbol)
    expect(symbols).toContain('VELO')
  })

  it('populates trending tokens when the rankings API is unavailable', async () => {
    mockUseTokenRankingsQuery.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isFetching: false,
      refetch: jest.fn(),
    } as any)

    const { result } = renderHook(() => useTrendingTokensCurrencyInfos(UniverseChainId.Ink))

    await waitFor(() => expect(result.current.loading).toBe(false))
    const symbols = result.current.data?.map((currency) => currency.currency.symbol)
    expect(symbols).toContain('USDC')
  })
})
