import { defineConfig } from 'vitest/config'
import { codecovVitePlugin } from '@codecov/vite-plugin'

const isCi = process.env.CI !== undefined

export default defineConfig({
	test: {
		mockReset: true,
		environment: 'node',
		include: ['src/**/*.test.{ts,tsx}'],
		globals: true,
		coverage: {
			enabled: true,
			provider: 'v8',
			reporter: [
				'html',
				'lcov',
				isCi ? 'json-summary' : 'json',
				isCi ? 'text' : 'text-summary',
			],
			all: true,
			include: ['src/**/*.ts'],
			reportOnFailure: true,
			exclude: ['src/tests/*', 'src/index.ts', 'src/plugins/supportFilesInSchema.ts'],
		},
		reporters: ['default', 'junit'],
		outputFile: 'test-report.junit.xml',
		snapshotFormat: {
			escapeString: false,
			printBasicPrototype: false,
		},
	},
	plugins: [
		codecovVitePlugin({
			enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
			bundleName: 'unoserver',
			uploadToken: process.env.CODECOV_TOKEN,
		}),
	],
})
