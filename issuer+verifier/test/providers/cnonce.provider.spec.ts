import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { cnonce } from '../../src/providers/cnonce.provider'
import { CnonceProvider } from '../../src/providers/provider.types'
// Cnonce type import might not be strictly necessary for these tests,
// as we are primarily testing string characteristics.
// import { Cnonce } from '../../src/cnonce.types'

describe('CnonceProvider', () => {
  const provider: CnonceProvider = cnonce()

  it('should be a CnonceProvider', () => {
    assert.ok(provider, 'Provider instance should be created')
    assert.equal(typeof provider.generate, 'function', 'Provider should have a generate function')
  })

  it('should have correct kind, name, and single properties', () => {
    assert.equal(provider.kind, 'cnonce-provider', "Kind should be 'cnonce-provider'")
    assert.equal(
      provider.name,
      'default-cnonce-provider',
      "Name should be 'default-cnonce-provider'"
    )
    assert.strictEqual(provider.single, true, 'Single should be true')
  })

  describe('generate()', () => {
    it('should generate a Cnonce string', async () => {
      const generatedCnonce = await provider.generate()
      assert.ok(typeof generatedCnonce === 'string', 'Generated cnonce should be a string')
      assert.equal(generatedCnonce.length, 32, 'Generated cnonce should have 32 characters')
    })

    it('should generate different cnonces on subsequent calls', () => {
      const cnonce1 = provider.generate()
      const cnonce2 = provider.generate()
      assert.notEqual(
        cnonce1,
        cnonce2,
        'Generated cnonces should be different to ensure randomness'
      )
    })

    it('should generate a Cnonce containing only hexadecimal characters', async () => {
      const generatedCnonce = await provider.generate()
      // Regular expression to check for 32 hexadecimal characters
      const hexRegex = /^[0-9a-fA-F]{32}$/
      assert.ok(
        hexRegex.test(generatedCnonce),
        'Generated cnonce should consist of 32 hexadecimal characters'
      )
    })
  })
})
