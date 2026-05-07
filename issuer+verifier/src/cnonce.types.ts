import { z } from 'zod'

const cnonceSchema = z.string().brand('Cnonce')

export type Cnonce = z.infer<typeof cnonceSchema>
export const Cnonce = (value?: string) => cnonceSchema.parse(value)
Cnonce.schema = cnonceSchema
