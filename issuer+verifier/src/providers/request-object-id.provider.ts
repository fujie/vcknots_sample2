import { randomUUID } from 'node:crypto'
import { RequestObjectIdProvider } from './provider.types'
import { RequestObjectId } from '../request-object-id.types'

export const requestObjectId = (): RequestObjectIdProvider => {
  return {
    kind: 'request-object-id-provider',
    name: 'default-request-object-id-provider',
    single: true,

    async generate() {
      return RequestObjectId(randomUUID().replaceAll('-', ''))
    },
  }
}
