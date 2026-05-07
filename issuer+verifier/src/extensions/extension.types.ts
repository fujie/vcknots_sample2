export type Extension<T = unknown[], R = unknown> = {
  on: string
  intercept(original: (xs: T) => R, xs: T): R
}
