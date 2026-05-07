export type DeepPartialUnknown<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? unknown[]
    : T[P] extends object
      ? DeepPartialUnknown<T[P]>
      : unknown
}
