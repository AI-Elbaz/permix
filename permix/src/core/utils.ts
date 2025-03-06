/**
 * @example
 * const permissions = {
 *   post: {
 *     create: true,
 *     read: false,
 *   },
 * }
 *
 * isRulesValid(permissions) // true
 *
 * const permissions2 = {
 *   post: {
 *     create: true,
 *     read: 'string',
 *   },
 * }
 *
 * isRulesValid(permissions2) // false
 */
export function isRulesValid<T>(value: unknown): value is T {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return Object.values(value)
    .every(action => Object.values(action)
      .every(action => typeof action === 'boolean' || typeof action === 'function'))
}

export type MaybePromise<T> = T | Promise<T>
