import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  WithProviderRegistry,
  initializeProviderRegistry,
  withProviderRegistry,
} from '../../src/providers/provider.registry'
import { Provider } from '../../src/providers/provider.types'

describe('ProviderRegistry', () => {
  describe('get', () => {
    it('should get default providers', () => {
      const kind: Provider['kind'] = 'issuer-metadata-store-provider'
      const providers = initializeProviderRegistry()
      const provider = providers.get(kind)
      assert.equal(provider.kind, kind)
    })
    it('should inject providers (single: true)', () => {
      const kind: Provider['kind'] = 'holder-binding-provider'
      const providers = initializeProviderRegistry()
      const provider = providers.get(kind)

      assert.notEqual(
        (provider as unknown as WithProviderRegistry).providers,
        withProviderRegistry.providers
      )
    })
    it('should inject providers (single: false)', () => {
      const kind: Provider['kind'] = 'credential-proof-provider'
      const providers = initializeProviderRegistry()
      const provider = providers.get(kind)

      assert.notDeepEqual(
        provider.map((it) => (it as unknown as WithProviderRegistry).providers),
        Array.from({ length: provider.length }, (it) => withProviderRegistry.providers)
      )
    })
  })

  describe('select', () => {
    it('should select a provider', () => {
      const kind: Provider['kind'] = 'issuer-signature-key-provider'
      const providers = initializeProviderRegistry()
      const provider = providers.select(kind, 'ES256')
      assert.equal(provider.kind, kind)
    })
  })
})
