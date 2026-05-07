import { z } from 'zod'

const authorizationCodeSchema = z.string().brand('AuthorizationCode')
export type AuthorizationCode = z.infer<typeof authorizationCodeSchema>
export const AuthorizationCode = (value?: string) => authorizationCodeSchema.parse(value)
AuthorizationCode.schema = authorizationCodeSchema
