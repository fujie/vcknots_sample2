import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CredentialConfiguration,
  CredentialIssuer,
  CredentialIssuerMetadata,
} from '../../../src/credential-issuer.types'
import { inMemoryIssuerMetadataStore } from '../../../src/providers/in-memory/in-memory-issuer-metadata-store.provider'

describe('InMemoryIssuerMetadataProvider', () => {
  const metadata: CredentialIssuerMetadata = {
    credential_issuer: CredentialIssuer('https://example.com/issuer'),
    credential_endpoint: 'https://example.com/issuer/credential',
    authorization_servers: ['https://example.com/authz'],
    batch_credential_endpoint: 'https://example.com/issuer-full/batch_credential',
    deferred_credential_endpoint: 'https://example.com/issuer-full/deferred_credential',
    credential_response_encryption_alg_values_supported: ['ECDH-ES+A256KW'],
    credential_response_encryption_enc_values_supported: ['A256GCM'],
    require_credential_response_encryption: true,
    credential_configurations_supported: {
      EmployeeID_jwt_vc_json: {
        format: 'jwt_vc_json',
        scope: 'employee_id',
        cryptographic_binding_methods_supported: ['did:example'],
        cryptographic_suites_supported: ['ES256K'],
        credential_definition: {
          type: ['VerifiableCredential', 'EmployeeIDCredential'],
          credentialSubject: {
            employee_id: { mandatory: true, value_type: 'string' },
            given_name: { display: [{ name: 'Given Name', locale: 'en-US' }] },
          },
        },
        proof_types_supported: {
          jwt: {
            proof_signing_alg_values_supported: ['ES256'],
          },
        },
        credential_signing_alg_values_supported: ['ES256'],
        display: [
          {
            name: 'Employee ID',
            locale: 'en-US',
            logo: {
              uri: 'https://example.com/logo.png',
              alt_text: 'Employee ID Logo',
            },
            description: 'Digital Employee ID Card',
            background_color: '#0000FF',
            text_color: '#FFFFFF',
          },
        ],
      } satisfies CredentialConfiguration, // Type assertion
    },
    display: [
      {
        name: 'Example Issuer',
        locale: 'en-US',
        logo: {
          uri: 'https://example.com/issuer-logo.png',
          alt_text: 'Issuer Logo',
        },
      },
    ],
  }

  it('should save and fetch issuer metadata', async () => {
    const provider = inMemoryIssuerMetadataStore()
    await provider.save(metadata)
    const fetchedMetadata = await provider.fetch(metadata.credential_issuer)
    assert.deepEqual(fetchedMetadata, metadata)
  })

  it('should return null when fetching metadata for an unknown issuer', async () => {
    const provider = inMemoryIssuerMetadataStore()
    const fetchedMetadata = await provider.fetch(
      CredentialIssuer('https://unknown.example.com/issuer')
    )
    assert.equal(fetchedMetadata, null)
  })

  it('should save and fetch multiple issuer metadata entries', async () => {
    const provider = inMemoryIssuerMetadataStore()
    const first = metadata
    const second: CredentialIssuerMetadata = {
      ...metadata,
      credential_issuer: CredentialIssuer('https://example.com/issuer2'),
      credential_endpoint: 'https://example.com/issuer2/credential',
    }
    await provider.save(first)
    await provider.save(second)

    const third = await provider.fetch(CredentialIssuer(first.credential_issuer))
    assert.deepEqual(third, first)

    const forth = await provider.fetch(CredentialIssuer(second.credential_issuer))
    assert.deepStrictEqual(forth, second)
  })

  it('should overwrite existing issuer metadata when saving with the same issuer URI', async () => {
    const provider = inMemoryIssuerMetadataStore()
    await provider.save(metadata)

    const updated: CredentialIssuerMetadata = {
      ...metadata,
      credential_endpoint: 'https://example.com/issuer/updated_credential',
      authorization_servers: ['https://example.com/new-authz'],
    }
    await provider.save(updated)

    const fetched = await provider.fetch(metadata.credential_issuer)

    assert.notEqual(fetched, null)
    assert.deepEqual(fetched, updated)
    assert.notDeepEqual(fetched.authorization_servers, metadata.authorization_servers)
    assert.equal(fetched.authorization_servers, updated.authorization_servers)
  })
})
