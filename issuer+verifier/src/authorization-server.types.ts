import { z } from 'zod'

const authorizationServerIssuerSchema = z.string().url().brand('AuthorizationServerIssuer')
export type AuthorizationServerIssuer = z.infer<typeof authorizationServerIssuerSchema>
export const AuthorizationServerIssuer = (value?: string) =>
  authorizationServerIssuerSchema.parse(value)
AuthorizationServerIssuer.schema = authorizationServerIssuerSchema

// https://www.rfc-editor.org/info/rfc8414
// OAuth 2.0 Authorization Server Metadata
export const authorizationServerMetadataSchema = z.object({
  'pre-authorized_grant_anonymous_access_supported': z.boolean().optional(),
  issuer: authorizationServerIssuerSchema,
  authorization_endpoint: z.string().url(),
  token_endpoint: z.string().url(),
  jwks_uri: z.string().url().optional(),
  registration_endpoint: z.string().url().optional(),
  scopes_supported: z.array(z.string()).optional(),
  response_types_supported: z.array(z.string()),
  response_modes_supported: z.array(z.string()).optional(),
  grant_types_supported: z.array(z.string()).optional(),
  token_endpoint_auth_methods_supported: z.array(z.string()).optional(),
  token_endpoint_auth_signing_alg_values_supported: z.array(z.string()).optional(),
  service_documentation: z.string().url().optional(),
  ui_locales_supported: z.array(z.string()).optional(),
  op_policy_uri: z.string().url().optional(),
  op_tos_uri: z.string().url().optional(),
  revocation_endpoint: z.string().url().optional(),
  revocation_endpoint_auth_methods_supported: z.array(z.string()).optional(),
  revocation_endpoint_auth_signing_alg_values_supported: z.array(z.string()).optional(),
  introspection_endpoint: z.string().url().optional(),
  introspection_endpoint_auth_methods_supported: z.array(z.string()).optional(),
  introspection_endpoint_auth_signing_alg_values_supported: z.array(z.string()).optional(),
  code_challenge_methods_supported: z.array(z.string()).optional(),
})
export type AuthorizationServerMetadata = z.infer<typeof authorizationServerMetadataSchema>
export const AuthorizationServerMetadata = (value?: {
  'pre-authorized_grant_anonymous_access_supported'?: boolean
  issuer?: string
  authorization_endpoint?: string
  token_endpoint?: string
  jwks_uri?: string
  registration_endpoint?: string
  scopes_supported?: string[]
  response_types_supported?: string[]
  response_modes_supported?: string[]
  grant_types_supported?: string[]
  token_endpoint_auth_methods_supported?: string[]
  token_endpoint_auth_signing_alg_values_supported?: string[]
  service_documentation?: string
  ui_locales_supported?: string[]
  op_policy_uri?: string
  op_tos_uri?: string
  revocation_endpoint?: string
  revocation_endpoint_auth_methods_supported?: string[]
  revocation_endpoint_auth_signing_alg_values_supported?: string[]
  introspection_endpoint?: string
  introspection_endpoint_auth_methods_supported?: string[]
  introspection_endpoint_auth_signing_alg_values_supported?: string[]
  code_challenge_methods_supported?: string[]
}) => authorizationServerMetadataSchema.parse(value)
AuthorizationServerMetadata.schema = authorizationServerMetadataSchema
