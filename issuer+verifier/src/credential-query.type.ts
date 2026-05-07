import { z } from 'zod'
import { Dcql } from './dcql.type'
import { PresentationExchange } from './presentation-exchange.types'
import { DeepPartialUnknown } from './type.utils'

const credentialQueryOptionsSchema = z.union([
  z.object({
    kind: z.literal('presentation-exchange'),
    query: PresentationExchange.schema,
  }),
  z.object({
    kind: z.literal('dcql'),
    query: Dcql.schema,
  }),
])

export type CredentialQueryOptions = z.infer<typeof credentialQueryOptionsSchema>
export const CredentialQueryOptions = (value?: DeepPartialUnknown<CredentialQueryOptions>) =>
  credentialQueryOptionsSchema.parse(value)
CredentialQueryOptions.schema = credentialQueryOptionsSchema

export type CredentialQuery = PresentationExchange | Dcql
export type CredentialQueryType = 'presentation-exchange' | 'dcql'
