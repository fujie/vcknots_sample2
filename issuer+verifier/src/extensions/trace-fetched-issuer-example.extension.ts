import { CredentialIssuer, CredentialIssuerMetadata } from '../credential-issuer.types'
import { Extension } from './extension.types'

export const traceFetchedIssuer = (): Extension<
  CredentialIssuer,
  Promise<CredentialIssuerMetadata | null>
> => {
  return {
    on: 'issuer-store-provider.fetch',
    async intercept(original, xs) {
      const issuer = await original(xs)

      if (issuer) {
        console.log(JSON.stringify(issuer, null, '\t'))
      }

      return issuer
    },
  }
}
