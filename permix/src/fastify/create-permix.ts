import type { FastifyPluginAsync, FastifyReply, FastifyRequest, RouteHandler } from 'fastify'
import type { Permix as PermixCore, PermixDefinition, PermixRules } from '../core/create-permix'
import type { CheckContext, CheckFunctionParams } from '../core/params'
import type { MaybePromise } from '../core/utils'
import fp from 'fastify-plugin'
import { createPermix as createPermixCore } from '../core/create-permix'
import { createCheckContext } from '../core/params'
import { pick } from '../utils'

const permixSymbol = Symbol('permix')

export interface MiddlewareContext {
  request: FastifyRequest
  reply: FastifyReply
}

export interface PermixOptions<T extends PermixDefinition> {
  /**
   * Custom error handler
   */
  onForbidden?: (params: CheckContext<T> & MiddlewareContext) => MaybePromise<void>
}

export interface Permix<Definition extends PermixDefinition> {
  /**
   * Register the plugin
   */
  plugin: (callback: (context: MiddlewareContext) => MaybePromise<PermixRules<Definition>>) => FastifyPluginAsync
  /**
   * Get the Permix instance
   */
  get: (request: FastifyRequest, reply: FastifyReply) => Pick<PermixCore<Definition>, 'check' | 'checkAsync'>
  /**
   * Check the middleware
   */
  checkHandler: <K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) => RouteHandler
}

/**
 * Create a middleware function that checks permissions for Fastify routes.
 *
 * @link https://permix.letstri.dev/docs/integrations/fastify
 */
export function createPermix<Definition extends PermixDefinition>(
  {
    onForbidden = ({ reply }) => {
      reply.status(403).send({ error: 'Forbidden' })
    },
  }: PermixOptions<Definition> = {},
): Permix<Definition> {
  function getPermix(request: FastifyRequest, reply: FastifyReply) {
    try {
      const permix = request.getDecorator(permixSymbol) as PermixCore<Definition> | undefined

      if (!permix) {
        throw new Error('Not found')
      }

      return pick(permix, ['check', 'checkAsync'])
    }
    catch {
      reply.status(500).send({ error: '[Permix]: Instance not found. Please register the `plugin` function.' })
      return null!
    }
  }

  function plugin(callback: (context: MiddlewareContext) => MaybePromise<PermixRules<Definition>>): FastifyPluginAsync {
    return fp(async (fastify) => {
      const permix = createPermixCore<Definition>()

      fastify.decorateRequest(permixSymbol, null)

      fastify.addHook('onRequest', async (request, reply) => {
        permix.setup(await callback({ request, reply }))
        request.setDecorator(permixSymbol, permix)
      })
    }, {
      fastify: '5.x',
      name: 'permix',
    })
  }

  function checkHandler<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>): RouteHandler {
    return async (request, reply) => {
      const permix = getPermix(request, reply)

      const hasPermission = permix.check(...params)

      if (!hasPermission) {
        await onForbidden({
          request,
          reply,
          ...createCheckContext(...params),
        })
      }
    }
  }

  return {
    plugin,
    get: getPermix,
    checkHandler,
  }
}
