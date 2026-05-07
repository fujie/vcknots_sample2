package mockserver

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"time"

	"github.com/go-jose/go-jose/v4"
	"github.com/go-jose/go-jose/v4/jwt"
)

// KeyPair represents a cryptographic key pair for testing
type KeyPair struct {
	PrivateKey *ecdsa.PrivateKey
	PublicKey  *ecdsa.PublicKey
	KeyID      string
}

// GenerateKeyPair creates a new ECDSA P-256 key pair for testing
func GenerateKeyPair(keyID string) (*KeyPair, error) {
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, err
	}

	return &KeyPair{
		PrivateKey: privateKey,
		PublicKey:  &privateKey.PublicKey,
		KeyID:      keyID,
	}, nil
}

// MustGenerateKeyPair is like GenerateKeyPair but panics on error
func MustGenerateKeyPair(keyID string) *KeyPair {
	kp, err := GenerateKeyPair(keyID)
	if err != nil {
		panic(err)
	}
	return kp
}

// CreateJWK creates a JOSE JSONWebKey from the key pair
func (kp *KeyPair) CreateJWK() jose.JSONWebKey {
	return jose.JSONWebKey{
		Key:       kp.PrivateKey,
		KeyID:     kp.KeyID,
		Algorithm: string(jose.ES256),
	}
}

// CreatePublicJWK creates a public JOSE JSONWebKey from the key pair
func (kp *KeyPair) CreatePublicJWK() jose.JSONWebKey {
	return jose.JSONWebKey{
		Key:       kp.PublicKey,
		KeyID:     kp.KeyID,
		Algorithm: string(jose.ES256),
	}
}

// CreateJWKS creates a JWKS (JSON Web Key Set) containing this key
func (kp *KeyPair) CreateJWKS() map[string]interface{} {
	publicJWK := kp.CreatePublicJWK()
	return map[string]interface{}{
		"keys": []jose.JSONWebKey{publicJWK},
	}
}

// JWTBuilder helps create signed JWTs for testing
type JWTBuilder struct {
	keyPair *KeyPair
	signer  jose.Signer
}

// NewJWTBuilder creates a new JWT builder with the given key pair
func NewJWTBuilder(keyPair *KeyPair) (*JWTBuilder, error) {
	joseKey := keyPair.CreateJWK()

	// Create signer with proper 'typ' header for OID4VP JWT Request Objects
	signerOptions := &jose.SignerOptions{}
	signerOptions.WithType("oauth-authz-req+jwt") // Required by OID4VP specification

	signer, err := jose.NewSigner(jose.SigningKey{Algorithm: jose.ES256, Key: joseKey}, signerOptions)
	if err != nil {
		return nil, err
	}

	return &JWTBuilder{
		keyPair: keyPair,
		signer:  signer,
	}, nil
}

// MustNewJWTBuilder is like NewJWTBuilder but panics on error
func MustNewJWTBuilder(keyPair *KeyPair) *JWTBuilder {
	builder, err := NewJWTBuilder(keyPair)
	if err != nil {
		panic(err)
	}
	return builder
}

// CreateSignedJWT creates a signed JWT with the given issuer and claims
func (jb *JWTBuilder) CreateSignedJWT(issuer string, claims map[string]interface{}) (string, error) {
	now := time.Now()
	defaultClaims := map[string]interface{}{
		"iss": issuer,
		"iat": now.Unix(),
		"exp": now.Add(time.Hour).Unix(),
	}

	// Merge with provided claims (provided claims override defaults)
	for k, v := range claims {
		defaultClaims[k] = v
	}

	token, err := jwt.Signed(jb.signer).Claims(defaultClaims).Serialize()
	return token, err
}

// CreateSignedJWTWithDuration creates a signed JWT with custom expiration duration
func (jb *JWTBuilder) CreateSignedJWTWithDuration(issuer string, claims map[string]interface{}, duration time.Duration) (string, error) {
	now := time.Now()
	defaultClaims := map[string]interface{}{
		"iss": issuer,
		"iat": now.Unix(),
		"exp": now.Add(duration).Unix(),
	}

	for k, v := range claims {
		defaultClaims[k] = v
	}

	token, err := jwt.Signed(jb.signer).Claims(defaultClaims).Serialize()
	return token, err
}
