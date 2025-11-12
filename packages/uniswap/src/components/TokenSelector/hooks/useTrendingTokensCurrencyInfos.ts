import { ALL_NETWORKS_ARG, CustomRankingType } from '@universe/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { tokenRankingsStatToCurrencyInfo, useTokenRankingsQuery } from 'uniswap/src/data/rest/tokenRankings'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getAllInkCurrencyInfos } from 'uniswap/src/features/tokens/tokenLists/ink'

export function useTrendingTokensCurrencyInfos(
  chainFilter: Maybe<UniverseChainId>,
  skip?: boolean,
): {
  data: CurrencyInfo[] | undefined
  error: Error | undefined
  refetch: () => void
  loading: boolean
} {
  const { data, isLoading, error, refetch, isFetching } = useTokenRankingsQuery(
    {
      chainId: chainFilter?.toString() ?? ALL_NETWORKS_ARG,
    },
    !skip,
  )

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
        const infos = await getAllInkCurrencyInfos()
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
  }, [shouldLoadInkTokenList, inkRequestId])

  const refetchInkTokens = useCallback(() => {
    setInkRequestId((id) => id + 1)
  }, [])

  const trendingTokens = data?.tokenRankings[CustomRankingType.Trending]?.tokens
  const formattedTokens = useMemo(
    () => trendingTokens?.map(tokenRankingsStatToCurrencyInfo).filter((t): t is CurrencyInfo => Boolean(t)),
    [trendingTokens],
  )

  const fallbackData = shouldLoadInkTokenList ? inkTokens : formattedTokens
  const fallbackLoading = shouldLoadInkTokenList ? inkLoading : isLoading || isFetching
  const fallbackError = shouldLoadInkTokenList ? inkError : (error ?? undefined)

  const refetchAll = useCallback(() => {
    refetch().catch(() => undefined)
    if (shouldLoadInkTokenList) {
      refetchInkTokens()
    }
  }, [refetch, refetchInkTokens, shouldLoadInkTokenList])

  return { data: fallbackData, loading: fallbackLoading, error: fallbackError, refetch: refetchAll }
}
