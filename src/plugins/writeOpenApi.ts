import { writeFile } from 'node:fs'

import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'

const myPluginCallback: FastifyPluginCallback = (fastify, options, done) => {
	if (process.env.NODE_ENV !== 'production') {
		const specFile = './docs/api.json'

		fastify.ready(() => {
			const apiSpec = JSON.stringify(fastify.swagger(), null, 2)

			writeFile(specFile, apiSpec, err => {
				if (err) {
					return fastify.log.error(`failed to save api spec to ${specFile}`)
				}
				fastify.log.debug(`saved api spec to ${specFile}`)
			})
		})
	}
	done()
}

export default fp(myPluginCallback, '4.x')
