# Permix

Permix is a lightweight, framework-agnostic, type-safe permissions management library for JavaScript applications on the client and server sides.

> Highly inspired by [Web Dev Simplified](https://www.youtube.com/watch?v=5GG-VUvruzE)

## Documentation

You can find the documentation [here](https://permix.letstri.dev).

## Example

Here is an example of how to use Permix in a Next.js application:

```tsx
// lib/permix.ts
import { createPermix } from 'permix'
import { usePermix } from 'permix/react'

export const permix = createPermix<{
  post: {
    dataType: { id: string, title: string, authorId: string, role: 'admin' | 'user' }
    action: 'create' | 'update' | 'delete'
  }
}>()

export async function setupPermix(role: 'admin' | 'user') {
  await permix.setup({
    post: {
      create: true,
    },
    user: {
      delete: role === 'admin',
    },
  })

  return permix
}

export function usePermissions() {
  return usePermix(permix)
}

// lib/permix-server.ts
export async function setupPermixServer() {
  const headersStore = await headers()
  const user = someFunctionToGetUserFromHeaders(headersStore)

  return setupPermix(user.role)
}

// app/page.tsx
export default async function Home() {
  const permix = await setupPermixServer()

  return (
    <div>
      Can I delete a user?
      {' '}
      {permix.check('user', 'delete') ? 'Yes' : 'No'}
    </div>
  )
}

// app/client/page.tsx
'use client'

export default function Home() {
  const { check } = usePermissions()

  return (
    <div>
      Can I delete a user?
      {' '}
      {permix.check('user', 'delete') ? 'Yes' : 'No'}
    </div>
  )
}
```

More examples can be found in the [examples](./examples) directory.

## License

MIT License - see the [LICENSE](./LICENSE) file for details
