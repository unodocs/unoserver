import crypto from 'node:crypto'
import path from 'node:path'

import type { FastifyInstance } from 'fastify'

import type { FileConversion, File } from '../store.js'

export class CacheStore {
	protected cache: Map<string, FileConversion>
	protected app: FastifyInstance

	constructor(fastify: FastifyInstance) {
		this.cache = new Map()
		this.app = fastify
	}

	generateId(): string {
		return crypto.randomUUID().toString()
	}

	register(uuid: string, file: File, format: string): void {
		this.cache.set(uuid, <FileConversion>{
			uuid,
			name: path.basename(file.path ?? 'unknown'),
			format,
			size: file.size ?? 0,
			start: new Date(Date.now()),
		})
	}

	get(uuid: string): FileConversion | null {
		return this.cache.get(uuid) ?? null
	}

	remove(uuid: string): boolean {
		return this.cache.delete(uuid)
	}

	values(): FileConversion[] {
		return [...this.cache.values()]
	}

	size(): number {
		return this.cache.size
	}

	reset(): void {
		this.cache.clear()
	}
}
