import { z } from 'zod'

const preAuthorizedCodeSchema = z.string().brand('PreAuthorizedCode')
// tx_code Check
export type PreAuthorizedCode = z.infer<typeof preAuthorizedCodeSchema>
export const PreAuthorizedCode = (value?: string) => preAuthorizedCodeSchema.parse(value)
PreAuthorizedCode.schema = preAuthorizedCodeSchema
