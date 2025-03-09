import assert from 'node:assert/strict'
import { createReadStream } from 'node:fs'
import { rm, stat } from 'node:fs/promises'
import path from 'node:path'

import contentDisposition from 'content-disposition'
import { type FastifyPluginCallback } from 'fastify'
import httpErrors from 'http-errors'
import mime from 'mime-types'

import type { FailedFileConversion, FileConversion } from './plugins/store.js'
import { convertFile } from './utils/convertFile.js'
import { unoserver } from './utils/unoserver.js'
import { upload } from './utils/upload.js'

export const routes: FastifyPluginCallback = (app, options, next) => {
	app.post<{ Params: { format: string }; Querystring: { filter: string } }>(
		'/convert/:format',
		{
			preHandler: upload.single('file'),
			schema: {
				summary: 'Converts file using LibreOffice',
				consumes: ['multipart/form-data'],
				produces: ['application/octet-stream'],
				params: {
					format: {
						type: 'string',
						description: 'The file type/extension of the output file (ex pdf)',
					},
				},
				querystring: {
					filter: {
						type: 'string',
						description:
							'The export filter to use when converting. It is selected automatically if not specified.',
					},
				},
				body: {
					properties: { file: { type: 'string', format: 'binary' } },
					required: ['file'],
				},
				response: {
					'200': {},
				},
			},
		},
		async (req, res) => {
			assert(req.file !== undefined, new httpErrors.BadRequest('Expected file'))

			const { path: srcPath, destination } = req.file

			assert(
				srcPath !== undefined && destination !== undefined,
				'Expected "path" and "destination"',
			)

			const uuid = app.store.generateId()
			app.store.register(uuid, req.file, req.params.format)

			res.raw.on('error', (err: Error) =>
				app.failedConversions.register(uuid, err.message),
			)
			res.raw.on('timeout', () => app.failedConversions.register(uuid, 'timeout'))
			res.raw.on('close', () => {
				app.store.remove(uuid)
				rm(destination, { recursive: true }).catch(() => {
					// ignore
				})
			})

			const { targetPath } = await convertFile(srcPath, req.params.format, {
				filter: req.query.filter,
			})

			const stream = createReadStream(targetPath)

			const mimeType = mime.lookup(req.params.format)

			res.type(mimeType === false ? 'application/octet-stream' : mimeType)
			res.header('Content-Disposition', contentDisposition(path.parse(targetPath).base))

			const { size } = await stat(targetPath)
			res.header('Content-Length', size)

			res.send(stream)

			return res
		},
	)

	app.get(
		'/status',
		{
			schema: {
				summary: 'Lists the current load',
				consumes: ['application/json'],
				produces: ['application/json'],
				response: {
					'200': {
						type: 'object',
						properties: {
							queue: {
								type: 'object',
								properties: {
									queued: {
										type: 'integer',
										description: 'The number of queued items waiting to run.',
									},
									running: { type: 'integer', description: 'Number of running items.' },
								},
							},
							workers: { type: 'integer', description: 'Maximum simultaneous workers' },
							documents: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										uuid: { type: 'string' },
										name: { type: 'string' },
										format: {
											type: 'string',
											description: 'The format the file will be converted to',
										},
										size: { type: 'integer', description: 'in bytes' },
										start: { type: 'string', description: 'date/time string' },
									},
								},
							},
						},
					},
				},
			},
		},
		async (req, res) => {
			res.send({
				queue: unoserver.jobs(),
				workers:
					process.env.MAX_WORKERS !== undefined ? Number(process.env.MAX_WORKERS) : 8,
				documents: app.store.values().map((doc: FileConversion) => doc),
			})
		},
	)
	app.get(
		'/failed',
		{
			schema: {
				summary: `Lists the last ${app.failedConversions.limit()} failed conversions`,
				description:
					'This is not persisted, so it will be lost when the container restarts.',
				consumes: ['application/json'],
				produces: ['application/json'],
				response: {
					'200': {
						type: 'object',
						properties: {
							errors: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										uuid: { type: 'string' },
										name: { type: 'string' },
										format: {
											type: 'string',
											description: 'The format the file will be converted to',
										},
										size: { type: 'integer', description: 'in bytes' },
										start: { type: 'string', description: 'date/time string' },
										reason: { type: 'string' },
										failedAt: { type: 'string', description: 'date/time string' },
									},
								},
							},
						},
					},
				},
			},
		},
		async (req, res) => {
			res.send({
				errors: app.failedConversions.values().map((doc: FailedFileConversion) => doc),
			})
		},
	)

	next()
}
