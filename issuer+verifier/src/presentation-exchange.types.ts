import { z } from 'zod'
import { PresentationDefinition } from './presentation-definition.types'
import { DeepPartialUnknown } from './type.utils'

const presentationExchangeSchema = z.object({
  presentation_definition: PresentationDefinition.schema.optional(),
  presentation_definition_uri: z.string().url().optional(),
})
export type PresentationExchange = z.infer<typeof presentationExchangeSchema>
export const PresentationExchange = (value?: DeepPartialUnknown<PresentationExchange>) =>
  presentationExchangeSchema.parse(value)
PresentationExchange.schema = presentationExchangeSchema
