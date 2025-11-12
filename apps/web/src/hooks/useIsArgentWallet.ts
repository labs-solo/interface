import { ARGENT_WALLET_DETECTOR_ADDRESS } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContract } from 'wagmi'

export default function useIsArgentWallet(): boolean {
  const account = useAccount()

  const preferredChainId = account.chainId ?? UniverseChainId.Ink
  let detectorAddress = ARGENT_WALLET_DETECTOR_ADDRESS[preferredChainId]
  if (!detectorAddress) {
    detectorAddress = ARGENT_WALLET_DETECTOR_ADDRESS[UniverseChainId.Mainnet]
  }

  const readResult = useReadContract(
    detectorAddress
      ? {
          address: assume0xAddress(detectorAddress),
          abi: [
            {
              inputs: [{ internalType: 'address', name: '_wallet', type: 'address' }],
              name: 'isArgentWallet',
              outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'isArgentWallet',
          args: account.address ? [account.address] : undefined,
          query: { enabled: !!account.address },
        }
      : undefined,
  )

  if (!detectorAddress) {
    return false
  }

  return readResult.data ?? false
}
