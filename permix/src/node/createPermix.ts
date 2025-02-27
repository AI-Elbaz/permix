import type { IncomingMessage, ServerResponse } from 'node:http'
import type { PermixDefinition } from '../core/createPermix'
import type { PermixServer, PermixServerOptions } from '../core/createPermixServer'
import { createPermixServer } from '../core/createPermixServer'

/**
 * Create a middleware function that checks permissions for Node.js HTTP servers.
 * Compatible with Next.js, Nuxt.js, and raw Node.js HTTP servers.
 *
 * @link https://permix.letstri.dev/docs/integrations/server
 */
export function createPermix<Definition extends PermixDefinition>(
  options: PermixServerOptions<Definition, IncomingMessage, ServerResponse<IncomingMessage>> = {},
): PermixServer<Definition, IncomingMessage, ServerResponse<IncomingMessage>> {
  return createPermixServer(options)
}
