import { randomUUID } from 'node:crypto'
import { PreAuthorizedCode } from '../pre-authorized-code.types'
import { PreAuthorizedCodeProvider } from './provider.types'

export const preAuthorizedCode = (): PreAuthorizedCodeProvider => {
  return {
    kind: 'pre-authorized-code-provider',
    name: 'default-pre-authorized-code-provider',
    single: true,

    async generate() {
      return PreAuthorizedCode(randomUUID().replaceAll('-', ''))
    },
  }
}
