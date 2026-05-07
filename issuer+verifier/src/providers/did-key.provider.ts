import { DidDocument } from '../did.types'
import { DidProvider } from './provider.types'

export const did = (): DidProvider => {
  return {
    kind: 'did-provider',
    name: 'default-did-key-provider',
    single: false,

    async resolveDid(kid: string): Promise<DidDocument | null> {
      const { Resolver } = await import('did-resolver')
      const key = await import('key-did-resolver')
      const keyResolver = key.getResolver()
      const didResolver = new Resolver(keyResolver)

      const doc = await didResolver.resolve(kid)
      return doc.didDocument
    },
    canHandle(method: string): boolean {
      return method === 'key'
    },
  }
}
