import { Cnonce } from '../../cnonce.types'
import { CnonceStoreProvider } from '../provider.types'

export const inMemoryCnonceStore = (option?: {
  c_nonce_expire_in?: number
}): CnonceStoreProvider => {
  type CnonceStates = {
    c_nonce: string
    c_nonce_expires_at: number
  }
  const cNonceStates = new Map<Cnonce, CnonceStates>()

  return {
    kind: 'cnonce-store-provider',
    name: 'in-memory-cnonce-provider',
    single: true,

    async save(cnonce): Promise<void> {
      const expiresAt = new Date().getTime() + (option?.c_nonce_expire_in ?? 60 * 5 * 1000) // 5 minutes
      cNonceStates.set(cnonce, {
        c_nonce: cnonce,
        c_nonce_expires_at: expiresAt,
      })
      return
    },

    async validate(cnonce): Promise<boolean> {
      const cnonceState = cNonceStates.get(cnonce)
      if (!cnonceState) {
        return false
      }
      if (new Date().getTime() > cnonceState.c_nonce_expires_at) {
        return false
      }
      return true
    },

    async revoke(cnonce): Promise<void> {
      cNonceStates.delete(cnonce)
      return
    },
  }
}
