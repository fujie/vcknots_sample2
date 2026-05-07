import { Provider } from '../providers'
import { VcknotsOptions } from '../vcknots.options'
import { Extension } from './extension.types'

export type ExtensionRegistry = {
  weave<T extends Provider>(provider: T): T
}

export const initializeExtensionRegistry = (options?: VcknotsOptions): ExtensionRegistry => {
  const extensions = options?.extensions?.flat() ?? []

  const match = (provider: Provider, method: string | symbol): Extension[] => {
    const on = `${provider.kind}.${method.toString()}`
    // FIXME reduce O(n)
    // FIXME support glob pattern
    return extensions.filter((it) => it.on === on)
  }

  return {
    weave<T extends Provider>(provider: T) {
      const proxy = new Proxy(provider, {
        get(target, propKey, receiver) {
          const original = target[propKey as keyof T]

          if (typeof original === 'function') {
            const matchers = match(target, propKey)

            if (matchers.length === 0) return original

            const apply = (candidates: Extension[], target: Provider, args: unknown[]) => {
              if (candidates.length === 0) return original.apply(target, args)
              const [current, ...next] = candidates
              return current.intercept((xs: unknown[]): unknown => apply(next, target, xs), args)
            }

            return function __vcknots_extension_proxy__(...args: unknown[]) {
              const result = apply(matchers, target, args)
              return result
            }
          }
          return Reflect.get(target, propKey, receiver)
        },
      })
      return proxy
    },
  }
}
