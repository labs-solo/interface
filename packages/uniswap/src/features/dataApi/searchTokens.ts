import { SearchTokensResponse, SearchType } from '@uniswap/client-search/dist/search/v1/api_pb'
import { GqlResult } from '@universe/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { searchTokenToCurrencyInfo, useSearchTokensAndPoolsQuery } from 'uniswap/src/data/rest/searchTokensAndPools'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { NUMBER_OF_RESULTS_LONG } from 'uniswap/src/features/search/SearchModal/constants'
import { getInkCurrencyInfos } from 'uniswap/src/features/tokens/tokenLists/ink'
import { isWSOL } from 'uniswap/src/utils/isWSOL'
import { useEvent } from 'utilities/src/react/hooks'

export function useSearchTokens({
  searchQuery,
  chainFilter,
  skip,
  size = NUMBER_OF_RESULTS_LONG,
  hideWSOL = false,
}: {
  searchQuery: string | null
  chainFilter: UniverseChainId | null
  skip: boolean
  size?: number
  hideWSOL?: boolean
}): GqlResult<CurrencyInfo[]> {
  const { chains: enabledChainIds } = useEnabledChains()

  const isSvmConnected = useConnectionStatus(Platform.SVM).isConnected

  const variables = useMemo(
    () => ({
      searchQuery: searchQuery ?? undefined,
      chainIds: chainFilter ? [chainFilter] : enabledChainIds,
      searchType: SearchType.TOKEN,
      page: 1,
      size,
      prioritizeSvm: isSvmConnected,
    }),
    [searchQuery, chainFilter, size, enabledChainIds, isSvmConnected],
  )

  const tokenSelect = useEvent((data: SearchTokensResponse): CurrencyInfo[] => {
    return data.tokens
      .map((token) => searchTokenToCurrencyInfo(token))
      .filter((c): c is CurrencyInfo => {
        if (!c) {
          return false
        }
        // Filter out WSOL from Solana search results when hideWSOL is true
        if (hideWSOL && isWSOL(c.currency)) {
          return false
        }
        return true
      })
  })

  const {
    data: tokens,
    error,
    isPending,
    refetch,
  } = useSearchTokensAndPoolsQuery<CurrencyInfo[]>({
    input: variables,
    enabled: !skip,
    select: tokenSelect,
  })

  const shouldLoadInkTokenList = chainFilter === UniverseChainId.Ink && !skip
  const [inkTokens, setInkTokens] = useState<CurrencyInfo[] | undefined>()
  const [inkLoading, setInkLoading] = useState(false)
  const [inkError, setInkError] = useState<Error | undefined>()
  const [inkRequestId, setInkRequestId] = useState(0)
  const inkRequestIdRef = useRef(inkRequestId)

  useEffect(() => {
    inkRequestIdRef.current = inkRequestId
  }, [inkRequestId])

  useEffect(() => {
    let cancelled = false

    if (!shouldLoadInkTokenList) {
      setInkTokens(undefined)
      setInkError(undefined)
      setInkLoading(false)
      return () => {
        cancelled = true
      }
    }

    const currentRequestId = inkRequestId
    const fetchInkTokens = async (): Promise<void> => {
      setInkLoading(true)
      try {
        const infos = await getInkCurrencyInfos(searchQuery ?? undefined)
        if (!cancelled && inkRequestIdRef.current === currentRequestId) {
          setInkTokens(infos)
          setInkError(undefined)
        }
      } catch (inkListError) {
        if (!cancelled && inkRequestIdRef.current === currentRequestId) {
          setInkTokens(undefined)
          setInkError(inkListError instanceof Error ? inkListError : new Error('Failed to load Ink token list'))
        }
      } finally {
        if (!cancelled && inkRequestIdRef.current === currentRequestId) {
          setInkLoading(false)
        }
      }
    }

    fetchInkTokens().catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [shouldLoadInkTokenList, searchQuery, inkRequestId])

  const refetchInkTokens = useCallback(() => {
    setInkRequestId((id) => id + 1)
  }, [])

  const combinedTokens = shouldLoadInkTokenList ? mergeCurrencyInfoLists(tokens, inkTokens) : tokens
  const fallbackOnly = shouldLoadInkTokenList && !tokens?.length
  const combinedLoading = isPending || (fallbackOnly && inkLoading)
  const combinedError =
    (!tokens ? (error ?? undefined) : undefined) || (fallbackOnly && !inkTokens ? inkError : undefined)

  const refetchAll = useCallback(() => {
    refetch().catch(() => undefined)
    if (shouldLoadInkTokenList) {
      refetchInkTokens()
    }
  }, [refetch, refetchInkTokens, shouldLoadInkTokenList])

  return useMemo(
    () => ({ data: combinedTokens, loading: combinedLoading, error: combinedError, refetch: refetchAll }),
    [combinedTokens, combinedLoading, combinedError, refetchAll],
  )
}

function mergeCurrencyInfoLists(...lists: Array<CurrencyInfo[] | undefined>): CurrencyInfo[] | undefined {
  const merged: CurrencyInfo[] = []
  const seen = new Set<string>()

  lists.forEach((list) => {
    list?.forEach((currencyInfo) => {
      if (seen.has(currencyInfo.currencyId)) {
        return
      }

      seen.add(currencyInfo.currencyId)
      merged.push(currencyInfo)
    })
  })

  return merged.length ? merged : undefined
}
