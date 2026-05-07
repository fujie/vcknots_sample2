import { z } from 'zod'
import { DeepPartialUnknown } from './type.utils'

const inputDescriptorConstraintsFieldSchema = z.object({
  id: z.string().optional(),
  path: z.array(z.string()),
  purpose: z.string().optional(),
  name: z.string().optional(),
  filter: z.record(z.string(), z.unknown()).optional(),
  optional: z.boolean().optional(),
})

const inputDescriptorConstraintsSchema = z.object({
  fields: z.array(inputDescriptorConstraintsFieldSchema).optional(),
  limit_disclosure: z.enum(['required', 'preferred']).optional(),
})

// https://identity.foundation/presentation-exchange/spec/v2.0.0/#input-descriptor
const inputDescriptorSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  purpose: z.string().optional(),
  format: z.record(z.string(), z.unknown()).optional(),
  constraints: inputDescriptorConstraintsSchema,
  group: z.array(z.string()).optional(),
})

// @see https://github.com/colinhacks/zod?tab=readme-ov-file#recursive-types
export type SubmissionRequirement = {
  rule: 'all' | 'pick'
  min?: number
  max?: number
  from?: string
  from_nested?: SubmissionRequirement[]
}
const submissionRequirementSchema: z.ZodType<SubmissionRequirement> = z.object({
  rule: z.union([z.literal('all'), z.literal('pick')]),
  mix: z.number().optional(),
  max: z.number().optional(),
  from: z.string().optional(),
  from_nested: z.lazy(() => z.array(submissionRequirementSchema).optional()),
})

// https://identity.foundation/presentation-exchange/spec/v2.0.0/#presentation-definition
export const presentationDefinitionSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  purpose: z.string().optional(),
  input_descriptors: z.array(inputDescriptorSchema).optional(),
  submission_requirements: z.array(submissionRequirementSchema).optional(),
})
export type PresentationDefinition = z.infer<typeof presentationDefinitionSchema>
export const PresentationDefinition = (value?: DeepPartialUnknown<PresentationDefinition>) =>
  presentationDefinitionSchema.parse(value)
PresentationDefinition.schema = presentationDefinitionSchema
