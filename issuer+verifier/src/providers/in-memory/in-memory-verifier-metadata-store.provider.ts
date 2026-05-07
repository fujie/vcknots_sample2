import { ClientId } from '../../client-id.types'
import { VerifierMetadata } from '../../verifier-metadata.types'
import { VerifierMetadataStoreProvider } from '../provider.types'

export const inMemoryVerifierMetadataStore = (): VerifierMetadataStoreProvider => {
  const verifiers = new Map<ClientId, VerifierMetadata>()

  return {
    kind: 'verifier-metadata-store-provider',
    name: 'in-memory-verifier-metadata-store-provider',
    single: true,

    async fetch(verifier) {
      const metadata = verifiers.get(verifier) ?? null
      if (metadata == null) return null
      return metadata
    },

    async save(id, metadata) {
      verifiers.set(id, metadata)
    },
  }
}
