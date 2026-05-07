import { z } from 'zod'
import { DcqlQuery } from './dcql-query.types'
import { DeepPartialUnknown } from './type.utils'

const dcqlSchema = z.object({
  dcql_query: DcqlQuery.schema,
})
export type Dcql = z.infer<typeof dcqlSchema>
export const Dcql = (value?: DeepPartialUnknown<Dcql>) => dcqlSchema.parse(value)
Dcql.schema = dcqlSchema
