import type { AppRouter } from '@/server/main'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

export type { AppRouter } from '@/server/main'

export type RouterInput = inferRouterInputs<AppRouter>
export type RouterOutput = inferRouterOutputs<AppRouter>
