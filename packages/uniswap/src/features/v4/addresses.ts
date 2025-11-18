import { EVMUniverseChainId, UniverseChainId } from 'uniswap/src/features/chains/types'

export type V4ContractAddresses = {
  poolManager: string
  positionManager?: string
  positionDescriptor?: string
  stateView?: string
  quoter?: string
}

export const V4_CONTRACTS_BY_CHAIN: Partial<Record<EVMUniverseChainId, V4ContractAddresses>> = {
  [UniverseChainId.Ink]: {
    poolManager: '0x360e68faccca8ca495c1b759fd9eee466db9fb32',
    positionManager: '0x1b35d13a2e2528f192637f14b05f0dc0e7deb566',
    positionDescriptor: '0x42e3ccd9b7f67b5b2ee0c12074b84ccf2a8e7f36',
    stateView: '0x76fd297e2d437cd7f76d50f01afe6160f86e9990',
    quoter: '0x3972c00f7ed4885e145823eb7c655375d275a1c5',
  },
}

export function getV4Contracts(chainId: EVMUniverseChainId): V4ContractAddresses {
  const contracts = V4_CONTRACTS_BY_CHAIN[chainId]
  if (!contracts) {
    throw new Error(`No v4 contract addresses configured for chain ${chainId}`)
  }
  return contracts
}
