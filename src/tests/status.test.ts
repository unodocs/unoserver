import { expect } from 'vitest'

import type { File as UploadedFile } from '../plugins/store.js'

import { startTestServer } from './startTestServer.js'

const rtfFile: UploadedFile =  {
	fieldname: 'file',
	originalname: 'someUploadedFile.docx',
	encoding: 'utf8',
	mimetype: 'word/doc',
	size: 213400,
	filename: 'someUploadedFile.docx',
	path: 'tmp/someUploadedFile.docx'
}

const testServer = await startTestServer()

afterAll(async () => testServer.close())

test('/status', async () => {
	const uuid = "xxxCreate";
	const toFormat = 'pdf';
	testServer.store.register(uuid, rtfFile, toFormat);

	const response = await testServer.fetch(`status`, {
		method: 'GET',
	})

	expect(response.headers.get('content-type')).toBe(
		'application/json; charset=utf-8',
	)


	const payload: any = await response.json();
	testServer.log.debug(payload)

	expect(payload.documents.length).toBe(1)

	expect(payload.documents[0].uuid).toBe(uuid)
	expect(payload.documents[0].name).toBe(rtfFile.originalname)
	expect(payload.documents[0].format).toBe(toFormat)
	expect(payload.documents[0].size).toBe(rtfFile.size)

}, 30000)
