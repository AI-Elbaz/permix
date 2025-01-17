# Permix

Permix is a lightweight, framework-agnostic, type-safe permissions management library for JavaScript applications on the client and server sides.

## Documentation

You can find the documentation [here](https://permix.letstri.dev).

## Example

To quick start you only need to write the following code:

```ts
import { createPermix } from 'permix'

const permix = createPermix<{
  post: {
    action: 'read'
  }
}>()

await permix.setup({
  post: {
    read: true,
  }
})

permix.check('post', 'read') // true
```

Permix has other powerful features, so here's check out the [docs](https://permix.letstri.dev) or the [examples](../examples) directory.

## License

MIT License - see the [LICENSE](../LICENSE) file for details
