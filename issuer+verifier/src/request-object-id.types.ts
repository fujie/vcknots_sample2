import { z } from 'zod'

const requestObjectIdSchema = z.string().brand('RequestObjectId')
export type RequestObjectId = z.infer<typeof requestObjectIdSchema>
export const RequestObjectId = (value?: string) => requestObjectIdSchema.parse(value)
RequestObjectId.schema = requestObjectIdSchema
