import type { Request, Response } from 'express'
import type { PermixDefinition } from '../core/createPermix'
import type { PermixServer, PermixServerOptions } from '../core/createPermixServer'
import { createPermixServer } from '../core/createPermixServer'

/**
 * Create a middleware function that checks permissions for Express routes.
 *
 * @link https://permix.letstri.dev/docs/integrations/express
 */
export function createPermix<Definition extends PermixDefinition>(
  options: PermixServerOptions<Definition, Request, Response> = {},
): PermixServer<Definition, Request, Response> {
  return createPermixServer(options)
}
