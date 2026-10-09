import { PLANE_ATTRIBUTE } from '../../utils/planes';
import { readDeclaredPlanes } from '../useDeclaredPlanes';

describe('readDeclaredPlanes', () => {
	it('keeps the value with the most spans per service', () => {
		const planes = readDeclaredPlanes({
			columns: [
				{ name: 'service.name' },
				{ name: PLANE_ATTRIBUTE },
				{ name: 'count()' },
			],
			data: [
				['frontend', 'entry', 900],
				['frontend', 'internal', 12],
				['worker', 'data', 40],
			],
		});
		expect(Object.fromEntries(planes)).toStrictEqual({
			frontend: 'entry',
			worker: 'data',
		});
	});

	it('is empty without a result or the expected columns', () => {
		expect(readDeclaredPlanes(undefined).size).toBe(0);
		expect(
			readDeclaredPlanes({ columns: [{ name: 'count()' }], data: [[1]] }).size,
		).toBe(0);
	});
});
