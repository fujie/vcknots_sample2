import { RequestObject } from '../../request-object.types'
import { RequestObjectId } from '../../request-object-id.types'
import { RequestObjectStoreProvider } from '../provider.types'

export const inMemoryRequestObjectStore = (): RequestObjectStoreProvider => {
  const requestObjects = new Map<RequestObjectId, RequestObject>()

  return {
    kind: 'request-object-store-provider',
    name: 'in-memory-request-object-store-provider',
    single: true,

    async fetch(id) {
      const requestObject = requestObjects.get(id) ?? null
      if (requestObject == null) return null
      return requestObject
    },

    async save(id, requestObject) {
      requestObjects.set(id, requestObject)
    },

    async delete(id) {
      requestObjects.delete(id)
    },
  }
}
