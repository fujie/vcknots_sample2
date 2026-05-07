import { JwtSignatureProvider } from './provider.types'
import { err } from '../errors/vcknots.error'
import { createPublicKey } from 'node:crypto'
import * as jwt from 'jsonwebtoken'
import { Jwk } from '../jwk.type'

export const jwtSignature = (): JwtSignatureProvider => {
  return {
    kind: 'jwt-signature-provider',
    name: 'default-jwt-signature-provider',
    single: true,

    async verify(token, publicKey): Promise<boolean> {
      if (typeof token !== 'string') {
        throw err('INVALID_TOKEN', {
          message: 'Token is not supported.',
        })
      }

      const key = createPublicKey({ key: publicKey as Jwk, format: 'jwk' })
      const e = key.export({ format: 'pem', type: 'spki' })
      const pemKey = e.toString()

      try {
        jwt.verify(token, pemKey)
      } catch (e: unknown) {
        const decodedToken = jwt.decode(token, { complete: true })
        console.error('[VP JWT Signature Verification Failed]')
        console.error('  VP kid:', decodedToken?.header?.kid)
        console.error('  VP alg:', decodedToken?.header?.alg)
        console.error('  VP iss:', typeof decodedToken?.payload === 'object' ? (decodedToken?.payload as Record<string, unknown>)?.iss : 'N/A')
        console.error('  VP aud:', typeof decodedToken?.payload === 'object' ? (decodedToken?.payload as Record<string, unknown>)?.aud : 'N/A')
        console.error('  Public JWK used:', JSON.stringify(publicKey))
        console.error('  Error:', e instanceof Error ? e.message : String(e))
        if (e instanceof jwt.JsonWebTokenError) {
          throw err('INVALID_JWT', {
            message: `VP signature verification failed. kid=${decodedToken?.header?.kid}, alg=${decodedToken?.header?.alg}. Error: ${e.message}`,
          })
        }

        throw err('INTERNAL_SERVER_ERROR', {
          message: `Unexpected error: ${e}.`,
        })
      }

      return true
    },
  }
}
