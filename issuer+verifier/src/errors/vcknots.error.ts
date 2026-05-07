import { ErrorCodes } from './error.codes'

type VcknotsErrorOptions = ErrorOptions & { message?: string }

export class VcknotsError extends Error {
  constructor(code: ErrorCodes, options?: VcknotsErrorOptions) {
    super(`${options?.message ?? ''}`, options)

    this.name = code

    Error.captureStackTrace?.(this, VcknotsError)
  }
}

export const err = (code: ErrorCodes, options?: VcknotsErrorOptions): VcknotsError => {
  return new VcknotsError(code, options)
}

export const raise = (code: ErrorCodes, options?: VcknotsErrorOptions): never => {
  throw err(code, options)
}
