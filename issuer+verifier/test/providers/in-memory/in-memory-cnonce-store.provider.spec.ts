import assert from 'node:assert'
import { beforeEach, describe, it, test } from 'node:test'
import { Cnonce } from '../../../src/cnonce.types'
import { CnonceStoreProvider } from '../../../src/providers'
import { inMemoryCnonceStore } from '../../../src/providers/in-memory/in-memory-cnonce-store.provider'

describe('inMemoryCnonce', () => {
  let cnonceProvider: CnonceStoreProvider
  const testCnonce = Cnonce('test-cnonce-value')

  describe('When initialized with no options (default behavior)', () => {
    beforeEach(() => {
      cnonceProvider = inMemoryCnonceStore()
    })

    it('should have correct kind, name, and single properties', () => {
      assert.strictEqual(cnonceProvider.kind, 'cnonce-store-provider')
      assert.strictEqual(cnonceProvider.name, 'in-memory-cnonce-provider')
      assert.strictEqual(cnonceProvider.single, true)
    })

    it('save should store the cnonce, making it valid immediately', async () => {
      await cnonceProvider.save(testCnonce)
      const isValid = await cnonceProvider.validate(testCnonce)
      assert.strictEqual(isValid, true, 'Cnonce should be valid after saving')
    })

    it('validate should return false for a non-existent cnonce', async () => {
      const isValid = await cnonceProvider.validate(Cnonce('non-existent-cnonce'))
      assert.strictEqual(isValid, false)
    })

    it('revoke should remove the cnonce, making it invalid', async () => {
      await cnonceProvider.save(testCnonce)
      await cnonceProvider.revoke(testCnonce)
      const isValid = await cnonceProvider.validate(testCnonce)
      assert.strictEqual(isValid, false, 'Cnonce should be invalid after revoking')
    })

    it('revoke should not throw for a non-existent cnonce', async () => {
      await assert.doesNotThrow(async () => {
        await cnonceProvider.revoke(Cnonce('non-existent-cnonce'))
      })
    })

    it('validate should return true for a cnonce before its default expiration time (using mocked time)', async () => {
      const oneMinuteInMs = 1 * 60 * 1000
      const mocks = test.mock.timers
      mocks.enable()
      await cnonceProvider.save(testCnonce)
      try {
        mocks.tick(oneMinuteInMs)
        const isValid = await cnonceProvider.validate(testCnonce)
        assert.strictEqual(isValid, true, 'Cnonce should be valid before default expiry time')
      } finally {
        mocks.reset()
      }
    })

    it('validate should return false for an expired cnonce after default expiration (using mocked time)', async () => {
      const fiveMinutesInMs = 5 * 60 * 1000
      const mocks = test.mock.timers
      mocks.enable()
      await cnonceProvider.save(testCnonce)
      try {
        mocks.tick(fiveMinutesInMs + 1000)
        const isValid = await cnonceProvider.validate(testCnonce)
        assert.strictEqual(isValid, false, 'Cnonce should be invalid after default expiry time')
      } finally {
        mocks.reset()
      }
    })
  })

  describe('When initialized with custom expiration option', () => {
    const testExpiryMs = 3 * 60 * 1000
    beforeEach(() => {
      cnonceProvider = inMemoryCnonceStore({ c_nonce_expire_in: testExpiryMs })
    })

    it('save should store the cnonce with custom expiration, valid immediately', async () => {
      await cnonceProvider.save(testCnonce)
      const isValid = await cnonceProvider.validate(testCnonce)
      assert.strictEqual(
        isValid,
        true,
        'Cnonce should be valid immediately after saving with custom expiry'
      )
    })

    it('validate should return true for a cnonce before its options expiration time (using mocked time)', async () => {
      const oneMinuteInMs = 1 * 60 * 1000
      const mocks = test.mock.timers
      mocks.enable()
      await cnonceProvider.save(testCnonce)
      try {
        mocks.tick(oneMinuteInMs)
        const isValid = await cnonceProvider.validate(testCnonce)
        assert.strictEqual(isValid, true, 'Cnonce should be valid before default expiry time')
      } finally {
        mocks.reset()
      }
    })

    it('validate should return false for an expired cnonce after options expiration (using mocked time)', async () => {
      const fiveMinutesInMs = 5 * 60 * 1000
      const mocks = test.mock.timers
      mocks.enable()
      await cnonceProvider.save(testCnonce)
      try {
        mocks.tick(fiveMinutesInMs)
        const isValid = await cnonceProvider.validate(testCnonce)
        assert.strictEqual(isValid, false, 'Cnonce should be invalid after default expiry time')
      } finally {
        mocks.reset()
      }
    })
  })

  describe('Method return types', () => {
    beforeEach(() => {
      cnonceProvider = inMemoryCnonceStore()
    })

    it('save method should return a Promise that resolves to undefined', async () => {
      const result = await cnonceProvider.save(Cnonce('some-cnonce-for-return-test'))
      assert.strictEqual(result, undefined)
    })

    it('revoke method should return a Promise that resolves to undefined', async () => {
      const cnonceToRevoke = Cnonce('another-cnonce-for-return-test')
      await cnonceProvider.save(cnonceToRevoke)
      const result = await cnonceProvider.revoke(cnonceToRevoke)
      assert.strictEqual(result, undefined)
    })
  })
})
