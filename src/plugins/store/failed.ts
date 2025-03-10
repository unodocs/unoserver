import type { FastifyInstance } from 'fastify'
import { LRUCache } from 'lru-cache'

import type { FileConversion, FailedFileConversion } from '../store.js'

export class FailedStore {
	protected cache: LRUCache<string, FailedFileConversion>
	protected app: FastifyInstance
	protected maxFailed: number

	constructor(fastify: FastifyInstance) {
		this.maxFailed =
			process.env.MAX_FAILED_STORED !== undefined
				? Number(process.env.MAX_FAILED_STORED)
				: 500
		this.cache = new LRUCache({
			max: this.maxFailed,
		})

		this.app = fastify
	}

	limit(): number {
		return this.maxFailed
	}

	register(uuid: string, reason?: string): void {
		const conversion: FileConversion | null = this.app.store.get(uuid)

		if (conversion === null) {
			return
		}

		if (!this.app.store.remove(uuid)) {
			return
		}

		this.cache.set(conversion.uuid, <FailedFileConversion>{
			failedAt: new Date(Date.now()),
			reason,
			...conversion,
		})
	}

	values(): FailedFileConversion[] {
		return [...this.cache.values()]
	}

	size(): number {
		return this.cache.size
	}

	reset(): void {
		this.cache.clear()
	}
}
