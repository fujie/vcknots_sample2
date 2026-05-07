import { z } from 'zod'
import { jwkSchema } from './jwk.type'

// https://www.ietf.org/archive/id/draft-ietf-oauth-sd-jwt-vc-03.html#name-jwt-vc-issuer-metadata-resp
export const jwtVcIssuerResponseSchema = z.object({
  issuer: z.string(),
  jwks_uri: z.string().url().optional(),
  jwks: z
    .object({
      keys: z.array(jwkSchema),
    })
    .optional(),
})

export type JwtVcIssuerResponse = z.infer<typeof jwtVcIssuerResponseSchema>
