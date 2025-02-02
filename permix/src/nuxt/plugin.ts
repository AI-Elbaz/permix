/* c8 ignore start */
import type { ObjectPlugin } from 'nuxt/app'
import type { Permix, PermixDefinition } from '../core'
import { dehydrate, hydrate } from '../core'
import { permixPlugin as vuePlugin } from '../vue/index'

export function permixPlugin<Permissions extends PermixDefinition>(permix: Permix<Permissions>): ObjectPlugin {
  return {
    name: 'permix',
    setup(nuxtApp) {
      nuxtApp.vueApp.use(vuePlugin, { permix })

      if (import.meta.server) {
        nuxtApp.hook('app:rendered', () => {
          try {
            nuxtApp.payload.permix = dehydrate(permix)
          }
          catch (error) {
            if (!(error as Error)?.message.includes('dehydrate')) {
              throw error
            }
          }
        })
      }

      if (import.meta.client && nuxtApp.payload?.permix) {
        hydrate(permix, nuxtApp.payload.permix as any)
      }
    },
  }
}
/* c8 ignore end */
