import type { User } from './permix'
import { headers } from 'next/headers'
import { setupPermix } from './permix'
import 'server-only'

function someFunctionToGetUserFromHeaders(_headers: Headers) {
  return {
    id: '1',
    name: 'John Doe',
    role: 'admin',
  } satisfies User
}

export async function setupPermixServer() {
  const headersStore = await headers()
  const user = someFunctionToGetUserFromHeaders(headersStore)

  return setupPermix(user.role)
}
