import { AuthzFlow, initializeAuthzFlow } from './authz.flows'
import { IssuerFlow, initializeIssuerFlow } from './issuer.flows'
import { initializeContext } from './vcknots.context'
import { VcknotsOptions } from './vcknots.options'
import { VerifierFlow, initializeVerifierFlow } from './verifier.flows'

export type Vcknots = {
  issuer: IssuerFlow
  verifier: VerifierFlow
  authz: AuthzFlow
}

export const vcknots = (options?: VcknotsOptions): Vcknots => {
  const context = initializeContext(options)

  return {
    issuer: initializeIssuerFlow(context),
    verifier: initializeVerifierFlow(context),
    authz: initializeAuthzFlow(context),
  }
}
