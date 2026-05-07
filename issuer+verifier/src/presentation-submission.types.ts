import { z } from 'zod'
import { DeepPartialUnknown } from './type.utils'

// @see https://github.com/colinhacks/zod?tab=readme-ov-file#recursive-types
export type PathNested = {
  id: string
  format: string
  path: string
  path_nested?: PathNested
}

// https://identity.foundation/presentation-exchange/spec/v2.0.0/#presentation-submission
const descriptorMapSchema: z.ZodType<PathNested> = z.object({
  id: z.string(),
  format: z.string(),
  path: z.string(),
  path_nested: z.lazy(() => descriptorMapSchema.optional()),
})

// https://identity.foundation/presentation-exchange/spec/v2.0.0/#presentation-submission
const presentationSubmissionSchema = z.object({
  id: z.string(),
  definition_id: z.string(),
  descriptor_map: z.array(descriptorMapSchema),
})
export type PresentationSubmission = z.infer<typeof presentationSubmissionSchema>
export const PresentationSubmission = (value?: DeepPartialUnknown<PresentationSubmission>) =>
  presentationSubmissionSchema.parse(value)
PresentationSubmission.schema = presentationSubmissionSchema
