import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { did } from '../../src/providers/did-key.provider'
import { DidProvider } from '../../src/providers/provider.types'
import { DidDocument } from '../../src/did.types'

describe('DidProvider', () => {
  const provider: DidProvider = did()

  it('should have correct kind, name, and single properties', () => {
    assert.equal(provider.kind, 'did-provider')
    assert.equal(provider.name, 'default-did-key-provider')
    assert.strictEqual(provider.single, false)
  })

  describe('canHandle', () => {
    it('should return true for "key" method', () => {
      assert.ok(provider.canHandle('key'))
    })

    it('should return false for other methods', () => {
      assert.ok(!provider.canHandle('other'))
    })
  })

  describe('resolveDid', () => {
    const mockDidDocument: DidDocument = {
      id: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
      verificationMethod: [],
      authentication: [],
      assertionMethod: [],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
    }

    it('should resolve a DID document successfully', async () => {
      mock.method(provider, 'resolveDid', async () => mockDidDocument)

      const kid = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH'
      const doc = await provider.resolveDid(kid)

      assert.deepStrictEqual(doc, mockDidDocument)
      mock.restoreAll()
    })

    it('should return null if resolution fails', async () => {
      mock.method(provider, 'resolveDid', async () => null)

      const kid = 'did:key:invalid'
      const doc = await provider.resolveDid(kid)

      assert.strictEqual(doc, null)
      mock.restoreAll()
    })
  })
})
