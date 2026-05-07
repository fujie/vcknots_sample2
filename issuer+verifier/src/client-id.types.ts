import { z } from 'zod'

const clientIdSchema = z.string().url().brand('ClientId')
export type ClientId = z.infer<typeof clientIdSchema>

export const ClientId = (value?: unknown) => clientIdSchema.parse(value)
ClientId.schema = clientIdSchema
