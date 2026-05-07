import { randomUUID } from 'node:crypto'
import { Cnonce } from '../cnonce.types'
import { CnonceProvider } from './provider.types'

export const cnonce = (): CnonceProvider => {
  return {
    kind: 'cnonce-provider',
    name: 'default-cnonce-provider',
    single: true,

    async generate(): Promise<Cnonce> {
      return Cnonce(randomUUID().replaceAll('-', ''))
    },
  }
}
