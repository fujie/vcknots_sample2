import { z } from 'zod'
import { DeepPartialUnknown } from './type.utils'

const dcqlQuerySchema = z.object({
  credentials: z.array(
    // FIXME: Review the implementation based on the specification
    z.object({
      id: z.string(),
      format: z.string(),
      meta: z.record(z.string(), z.unknown()),
      claims: z.array(z.object({ path: z.array(z.string()) })),
    })
  ),
})

export type DcqlQuery = z.infer<typeof dcqlQuerySchema>
export const DcqlQuery = (value?: DeepPartialUnknown<DcqlQuery>) => dcqlQuerySchema.parse(value)
DcqlQuery.schema = dcqlQuerySchema
