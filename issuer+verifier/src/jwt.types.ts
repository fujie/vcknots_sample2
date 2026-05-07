import { z } from 'zod'

export const JwtHeaderSchema = z.object({
  alg: z.string(),
  typ: z.string().optional(),
  kid: z.string().optional(),
  jwk: z.record(z.string(), z.any()).optional(),
  x5c: z.array(z.string()).optional(),
  x5u: z.string().optional(),
  jku: z.string().optional(),
  x5t: z.string().optional(),
  crit: z.array(z.string()).optional(),
})

export const JwtPayloadSchema = z
  .object({
    iss: z.string().optional(),
    sub: z.string().optional(),
    aud: z.union([z.string(), z.array(z.string())]).optional(),
    exp: z.number().optional(),
    nbf: z.number().optional(),
    iat: z.number().optional(),
    jti: z.string().optional(),
  })
  .catchall(z.unknown())

export const JwtContentSchema = z.object({
  header: JwtHeaderSchema,
  payload: JwtPayloadSchema,
})

export type JwtPayload = z.infer<typeof JwtPayloadSchema>
export type JwtContent = z.infer<typeof JwtContentSchema>
