export function isObjectValidJson(value: unknown): boolean {
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
