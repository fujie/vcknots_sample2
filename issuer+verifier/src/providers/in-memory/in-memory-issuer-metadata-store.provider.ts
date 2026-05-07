import { CredentialIssuer, CredentialIssuerMetadata } from '../../credential-issuer.types'
import { IssuerMetadataStoreProvider } from '../provider.types'

export const inMemoryIssuerMetadataStore = (): IssuerMetadataStoreProvider => {
  const issuers = new Map<CredentialIssuer, CredentialIssuerMetadata>()

  return {
    kind: 'issuer-metadata-store-provider',
    name: 'in-memory-issuer-metadata-store-provider',
    single: true,

    async fetch(issuer) {
      return issuers.get(issuer) ?? null
    },
    async save(issuer) {
      issuers.set(issuer.credential_issuer, issuer)
    },
  }
}
