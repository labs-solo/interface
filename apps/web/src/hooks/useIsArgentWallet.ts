import { ARGENT_WALLET_DETECTOR_ADDRESS } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContract } from 'wagmi'

export default function useIsArgentWallet(): boolean {
  const account = useAccount()

  const preferredChainId = account.chainId ?? UniverseChainId.Ink
  const detectorAddress =
    ARGENT_WALLET_DETECTOR_ADDRESS[preferredChainId] ?? ARGENT_WALLET_DETECTOR_ADDRESS[UniverseChainId.Mainnet]

  if (!detectorAddress) {
    return false
  }

  return (
    useReadContract({
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
    }).data ?? false
  )
}
