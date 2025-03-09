import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'

import { CacheStore } from './store/cache.js'
import { FailedStore } from './store/failed.js'

declare module 'fastify' {
	interface FastifyInstance {
		store: CacheStore
		failedConversions: FailedStore
	}
}

export interface FileConversion {
	uuid: string
	name: string
	format: string
	size: number
	start: Date
}

export interface FailedFileConversion {
	uuid: string
	name: string
	format: string
	size: number
	start: Date
	failedAt: Date
	reason?: string
}

const myPluginCallback: FastifyPluginCallback = (fastify, options, done) => {
	fastify.decorate('store', new CacheStore(fastify))
	fastify.decorate('failedConversions', new FailedStore(fastify))
	done()
}

export default fp(myPluginCallback, '4.x')
