import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PreAuthorizedCode } from '../../src/pre-authorized-code.types'
import { preAuthorizedCode } from '../../src/providers/pre-authorized-code.provider'
import { PreAuthorizedCodeProvider } from '../../src/providers/provider.types'

describe('PreAuthorizedCodeProvider', () => {
  const provider: PreAuthorizedCodeProvider = preAuthorizedCode()

  it('should be a PreAuthorizedCodeProvider', () => {
    assert.ok(provider, 'Provider instance should be created')
    assert.equal(typeof provider.generate, 'function', 'Provider should have a generate function')
  })

  it('should have correct kind, name, and single properties', () => {
    assert.equal(
      provider.kind,
      'pre-authorized-code-provider',
      "Kind should be 'pre-authorized-code-provider'"
    )
    assert.equal(
      provider.name,
      'default-pre-authorized-code-provider',
      "Name should be 'default-pre-authorized-code-provider'"
    )
    assert.strictEqual(provider.single, true, 'Single should be true')
  })

  describe('generate()', () => {
    it('should generate a PreAuthorizedCode string', async () => {
      const generatedCode = await provider.generate()
      assert.ok(typeof generatedCode === 'string', 'Generated code should be a string')
      // UUID v4 without hyphens is 32 characters long
      assert.equal(generatedCode.length, 32, 'Generated code should have 32 characters')
      // Check if it's an instance of PreAuthorizedCode (branded type)
      assert.ok(
        generatedCode === PreAuthorizedCode(generatedCode),
        'Generated code should be a PreAuthorizedCode type'
      )
    })

    it('should generate different codes on subsequent calls', () => {
      const code1 = provider.generate()
      const code2 = provider.generate()
      assert.notEqual(code1, code2, 'Generated codes should be different to ensure randomness')
    })

    it('should generate a code containing only hexadecimal characters', async () => {
      const generatedCode = await provider.generate()
      // Regular expression to check for 32 hexadecimal characters
      const hexRegex = /^[0-9a-fA-F]{32}$/
      assert.ok(
        hexRegex.test(generatedCode),
        'Generated code should consist of 32 hexadecimal characters'
      )
    })
  })
})
