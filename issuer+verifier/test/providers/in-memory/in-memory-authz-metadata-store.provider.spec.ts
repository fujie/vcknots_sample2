import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  AuthorizationServerIssuer,
  AuthorizationServerMetadata,
} from '../../../src/authorization-server.types'
import { inMemoryAuthzServerMetadata } from '../../../src/providers/in-memory/in-memory-authz-metadata-store.provider'

describe('InMemoryAuthzServerMetadataStoreProvider', () => {
  const metadata: AuthorizationServerMetadata = {
    issuer: AuthorizationServerIssuer('https://auth.example.com'),
    authorization_endpoint: 'https://auth.example.com/authorize',
    token_endpoint: 'https://auth.example.com/token',
    jwks_uri: 'https://auth.example.com/jwks',
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
  }

  it('should return null for unknown issuer', async () => {
    const provider = inMemoryAuthzServerMetadata()
    const fetched = await provider.fetch(AuthorizationServerIssuer('https://unknown.com'))
    assert.equal(fetched, null)
  })

  it('should save and fetch metadata by issuer', async () => {
    const provider = inMemoryAuthzServerMetadata()
    await provider.save(metadata)

    const fetched = await provider.fetch(metadata.issuer)
    assert.deepEqual(fetched, metadata)
  })

  it('should overwrite metadata for the same issuer', async () => {
    const provider = inMemoryAuthzServerMetadata()

    await provider.save(metadata)
    const updated: AuthorizationServerMetadata = {
      ...metadata,
      token_endpoint: 'https://auth.example.com/new-token',
    }

    await provider.save(updated)
    const fetched = await provider.fetch(metadata.issuer)

    assert.notEqual(fetched, null)
    assert.equal(fetched?.token_endpoint, 'https://auth.example.com/new-token')
    assert.notDeepEqual(fetched, metadata)
  })
})
