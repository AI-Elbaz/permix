# Permix

Permix is a lightweight, type-safe permissions management library for JavaScript applications, with first-class support for React and Vue.

## Features

- 🔒 Type-safe permission checking
- ⚡ Async permissions setup
- 🎯 Framework-agnostic core with React and Vue integrations
- 🔄 Dynamic permission updates
- 📦 Zero dependencies

## Installation

```bash
npm install permix
```

or

```bash
yarn add permix
```

or

```bash
pnpm add permix
```

## Basic Usage

```typescript
import { createPermix } from 'permix'

// Define your permission schema
const permix = createPermix<{
  post: {
    dataType: { id: string }
    action: 'create' | 'read' | 'update'
  }
}>()

// Setup permissions
await permix.setup({
  post: {
    create: true,
    read: false
  }
})

// Check permissions
permix.check('post', 'create') // returns true
permix.check('post', 'read') // returns false
```

## React Integration

```tsx
import { usePermix } from 'permix/react'

function MyComponent() {
  const { check } = usePermix(permix)

  return (
    <button disabled={!check('post', 'create')}>
      Create Post
    </button>
  )
}
```

Recommended to create a custom hook to use in components:

```tsx
// Create a custom hook
const usePermissions = () => usePermix(permix)

// Use in components
function MyComponent() {
  const { check } = usePermissions()
  // ...
}
```

## Vue Integration

```vue
<script setup>
import { usePermix } from 'permix/vue'

const { check } = usePermix(permix)
</script>

<template>
  <button :disabled="!check('post', 'create')">
    Create Post
  </button>
</template>
```

Recommended to create a custom hook to use in components:

```ts
// Create a custom hook
const usePermissions = () => usePermix(permix)
```

```vue
<script setup>
// Use in components
const { check } = usePermissions()
</script>

<template>
  <button :disabled="!check('post', 'create')">
    Create Post
  </button>
</template>
```

## Advanced Usage

### Dynamic Permission Setup

```typescript
// Async function-based setup
await permix.setup(async () => {
  const isAdmin = await checkUserRole()
  return {
    post: {
      create: isAdmin,
      read: true
    }
  }
})
```

### Permission Updates

```typescript
// Listen for permission changes
permix.on('setup', () => {
  console.log('Permissions updated:', permix.getRules())
})
```

## Type Safety

Permix is built with TypeScript and provides full type safety:

```typescript
interface Post {
  id: string
  title: string
}

const permix = createPermix<{
  post: {
    dataType: Post
    action: 'create' | 'read' | 'update'
  }
}>()

// Type error: 'delete' is not assignable to type 'create' | 'read' | 'update'
permix.check('post', 'delete')
```

## Important Notes

- Always await the `setup()` call to ensure permissions are properly initialized
- Permissions default to `false` for undefined actions
- Invalid entity names will return `false` for all permission checks

## License

MIT
