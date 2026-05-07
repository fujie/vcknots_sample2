import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { requestObjectId } from '../../src/providers/request-object-id.provider'
import { RequestObjectIdProvider } from '../../src/providers/provider.types'

describe('RequestObjectIdProvider', () => {
  const provider: RequestObjectIdProvider = requestObjectId()

  it('should be a RequestObjectIdProvider', () => {
    assert.ok(provider, 'Provider instance should be created')
    assert.equal(typeof provider.generate, 'function', 'Provider should have a generate function')
  })

  it('should have correct kind, name, and single properties', () => {
    assert.equal(
      provider.kind,
      'request-object-id-provider',
      "Kind should be 'request-object-id-provider'"
    )
    assert.equal(
      provider.name,
      'default-request-object-id-provider',
      "Name should be 'default-request-object-id-provider'"
    )
    assert.strictEqual(provider.single, true, 'Single should be true')
  })

  describe('generate()', () => {
    it('should generate a RequestObjectId string', async () => {
      const id = await provider.generate()
      assert.equal(typeof id, 'string', 'Generated id should be a string')
      assert.equal(id.length, 32, 'Generated id should have 32 characters (UUID without hyphens)')
    })

    it('should generate different ids on subsequent calls', async () => {
      const [id1, id2] = await Promise.all([provider.generate(), provider.generate()])
      assert.notEqual(id1, id2, 'Generated ids should be different to ensure randomness')
    })

    it('should contain only hexadecimal characters', async () => {
      const id = await provider.generate()
      const hex32 = /^[0-9a-fA-F]{32}$/
      assert.ok(hex32.test(id), 'Generated id should consist of 32 hexadecimal characters')
    })

    it('should not include hyphens', async () => {
      const id = await provider.generate()
      assert.ok(!id.includes('-'), 'Generated id should not contain hyphens')
    })
  })
})
