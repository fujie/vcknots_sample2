import { randomUUID } from 'node:crypto'
import * as z from 'zod'
import { CredentialConfiguration, CredentialIssuer } from '../credential-issuer.types'
import { CredentialFormats } from '../credential-request.types'
import { JwtVcJson, ProofJwt, VerifiableCredential } from '../credential.types'
import { raise } from '../errors/vcknots.error'
import { IssueCredentialProvider } from './provider.types'

export type IssueCredentialProviderOptions = {
  identifier?: () => string
}

export const issueCredentialJwt = (
  options?: IssueCredentialProviderOptions
): IssueCredentialProvider => {
  if (options?.identifier) {
    const id = options.identifier()
    if (!z.string().url().safeParse(id).success) {
      throw raise('INVALID_OPTIONS', {
        message: 'Identifier must be a valid URL.',
      })
    }
  }
  return {
    kind: 'issue-credential-provider',
    name: 'default-issue-credential-w3c-jwt-vc-json-provider',
    single: false,

    createCredential(
      credentialIssuer: CredentialIssuer,
      configuration: CredentialConfiguration,
      proof: ProofJwt,
      claimsOptions?: Record<string, unknown>
    ): VerifiableCredential<JwtVcJson> {
      const today = new Date()
      const kid = proof.header.kid
      if (!kid) {
        throw raise('INVALID_PROOF', {
          message: 'Unsupported proof header.',
        })
      }

      const credentialClaims: Record<string, unknown> = {}
      const credentialSubject = configuration.credential_definition.credentialSubject
      if (credentialSubject && Object.keys(credentialSubject).length > 0 && claimsOptions) {
        for (const [key, value] of Object.entries(credentialSubject)) {
          if (value.mandatory === true && !(key in claimsOptions)) {
            throw raise('INVALID_CLAIMS', {
              message: `Claim ${key} is not defined as mandatory in the credential definition.`,
            })
          }
          if (key in claimsOptions) {
            // unsupported  image media types such as image/jpeg as defined in IANA media type registry for images (https://www.iana.org/assignments/media-types/media-types.xhtml#image)
            if (value.value_type === 'string') {
              credentialClaims[key] = String(claimsOptions[key])
            } else if (value.value_type === 'number') {
              credentialClaims[key] = Number(claimsOptions[key])
            } else {
              credentialClaims[key] = claimsOptions[key]
            }
          }
        }
      }

      const id = options?.identifier
        ? options.identifier()
        : `${credentialIssuer}/vc/${randomUUID().replaceAll('-', '')}`

      const verifiableCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id,
        type: configuration.credential_definition.type,
        issuer: credentialIssuer,
        issuanceDate: today.toISOString(),
        credentialSubject: {
          id: kid,
          ...credentialClaims,
        },
      }

      return verifiableCredential
    },
    canHandle(format: CredentialFormats): boolean {
      return format === 'jwt_vc_json'
    },
  }
}
