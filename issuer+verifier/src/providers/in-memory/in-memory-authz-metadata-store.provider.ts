import {
  AuthorizationServerIssuer,
  AuthorizationServerMetadata,
} from '../../authorization-server.types'
import { AuthzServerMetadataStoreProvider } from '../provider.types'

export const inMemoryAuthzServerMetadata = (): AuthzServerMetadataStoreProvider => {
  const servers = new Map<AuthorizationServerIssuer, AuthorizationServerMetadata>()

  return {
    kind: 'authz-server-metadata-store-provider',
    name: 'in-memory-authz-server-metadata-store-provider',
    single: true,

    async fetch(issuer) {
      return servers.get(issuer) ?? null
    },

    async save(metadata) {
      servers.set(metadata.issuer, metadata)
    },
  }
}
