export function isPermissionsValidJson(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const isValidJsonValue = (val: unknown): boolean => {
    if (typeof val === 'function') {
      return false
    }

    if (typeof val === 'object' && val !== null) {
      return Object.values(val).every(isValidJsonValue)
    }

    return true
  }

  return isValidJsonValue(value)
}

/**
 * @example
 * const permissions = {
 *   post: {
 *     create: true,
 *     read: false,
 *   },
 * }
 *
 * isPermissionsValid(permissions) // true
 *
 * const permissions2 = {
 *   post: {
 *     create: true,
 *     read: 'string',
 *   },
 * }
 *
 * isPermissionsValid(permissions2) // false
 */
export function isPermissionsValid<T>(value: unknown): value is T {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return Object.values(value)
    .every(action => Object.values(action)
      .every(action => typeof action === 'boolean' || typeof action === 'function'))
}
