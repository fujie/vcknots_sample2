import { z } from 'zod'

const credentialResponseSchema = z.object({
  // string for JWT
  credential: z.string().or(z.array(z.string())).optional(),
  transaction_id: z.string().optional(),
  notification_id: z.string().optional(),
  c_nonce: z.string().optional(),
  c_nonce_expires_in: z.number().optional(),
})
export type CredentialResponse = z.infer<typeof credentialResponseSchema>
