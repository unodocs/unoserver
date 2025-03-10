import { expect } from 'vitest'

import type { File as UploadedFile } from '../plugins/store.js'

import { startTestServer } from './startTestServer.js'

const testServer = await startTestServer()

afterAll(async () => testServer.close())

const rtfFile: UploadedFile = {
	fieldname: 'file',
	originalname: 'someUploadedFile.docx',
	encoding: 'utf8',
	mimetype: 'word/doc',
	size: 213400,
	filename: 'someUploadedFile.docx',
	path: 'tmp/someUploadedFile.docx',
}
const defaultUuid = 'xxxCreate'
const defaultToFormat = 'pdf'
function registerFileInCacheStore(uuid: string, toFormat: string) {
	testServer.store.register(uuid, rtfFile, toFormat)
}

test('cache store register', async () => {
	registerFileInCacheStore(defaultUuid, defaultToFormat)

	expect(testServer.store.values().length).toBe(1);
	expect(testServer.store.size()).toBe(1);

	const entry = testServer.store.values()[0];
	expect(entry).toBeDefined();

	expect(entry?.uuid).toBe(defaultUuid)
	expect(entry?.name).toBe(rtfFile.originalname)
	expect(entry?.format).toBe(defaultToFormat)
	expect(entry?.size).toBe(rtfFile.size)
}, 30000)

test('cache store retrieval', async () => {
	registerFileInCacheStore(defaultUuid, defaultToFormat)

	expect(testServer.store.values().length).toBe(1);
	expect(testServer.store.size()).toBe(1);

	const entry = testServer.store.get(defaultUuid);

	expect(entry?.uuid).toBe(defaultUuid)
	expect(entry?.name).toBe(rtfFile.originalname)
	expect(entry?.format).toBe(defaultToFormat)
	expect(entry?.size).toBe(rtfFile.size)

	expect(testServer.store.get('unknown uuid')).toBeNull();
}, 30000)


test('cache store deletion', async () => {
	registerFileInCacheStore(defaultUuid, defaultToFormat)

	// Should return false if nothing is deleted
	expect(testServer.store.remove('randomUUID')).toBeFalsy()


	// Should return true if existing is deleted
	expect(testServer.store.remove(defaultUuid)).toBeTruthy()

	// Verify it's deleted
	expect(testServer.store.get(defaultUuid)).toBeNull();
}, 30000)


test('failed store register', async () => {
	registerFileInCacheStore(defaultUuid, defaultToFormat)

	testServer.failedConversions.register(defaultUuid, 'failed');

	// Should have been removed from the cache store
	expect(testServer.store.size()).toBe(0);
	expect(testServer.failedConversions.size()).toBe(1);

	const entry = testServer.failedConversions.values()[0];
	expect(entry).toBeDefined();

	expect(entry?.uuid).toBe(defaultUuid)
	expect(entry?.name).toBe(rtfFile.originalname)
	expect(entry?.format).toBe(defaultToFormat)
	expect(entry?.size).toBe(rtfFile.size)
	expect(entry?.reason).toBe('failed')
	expect(entry?.failedAt).toBeDefined()
}, 30000)


test('failed store limit respected', async () => {
	testServer.store.reset();
	testServer.failedConversions.reset();

	const limit = Number(process.env.MAX_FAILED_STORED);
	// Fill up the failed conversion store
	for(let i = 0; i < limit; i++) {
		const uuid = `${defaultUuid}${i}`;
		//testServer.log.warn(`register ${uuid}`)
		registerFileInCacheStore(uuid, defaultToFormat)
		testServer.failedConversions.register(uuid, 'failed');
	}

	const lastUuid = `${defaultUuid}Last`;
	registerFileInCacheStore(lastUuid, defaultToFormat)
	testServer.failedConversions.register(lastUuid, 'failed last');

	// Cache store should be empty
	expect(testServer.store.size()).toBe(0);
	// Failed conversion store should be at the limit
	expect(testServer.failedConversions.values().length).toBe(limit);

	const storeValues = testServer.failedConversions.values()

	const firstEntry = storeValues[0];
	expect(firstEntry).toBeDefined();
	expect(firstEntry?.uuid).toBe(lastUuid)

	const lastEntry = storeValues.pop();
	expect(lastEntry).toBeDefined();
	expect(lastEntry?.uuid).toBe(`${defaultUuid}1`)
}, 30000)
