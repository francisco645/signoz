import { buildAdjacency } from '../adjacency';
import { formatFocusList, getFocusSet } from '../traversal';

const adjacency = buildAdjacency([
	{ source: 'web', target: 'api' },
	{ source: 'api', target: 'bills' },
	{ source: 'jobs', target: 'bills' },
	{ source: 'bills', target: 'postgres' },
	{ source: 'bills', target: 'api' },
]);

describe('getFocusSet', () => {
	it('walks callers transitively upstream, handling cycles', () => {
		expect(
			Object.fromEntries(getFocusSet(adjacency, 'postgres', 'up')),
		).toStrictEqual({
			postgres: 0,
			bills: 1,
			api: 2,
			jobs: 2,
			web: 3,
		});
	});

	it('walks callees downstream', () => {
		expect(
			[...getFocusSet(adjacency, 'web', 'down').keys()].sort(),
		).toStrictEqual(['api', 'bills', 'postgres', 'web']);
	});

	it('joins both directions', () => {
		expect(
			[...getFocusSet(adjacency, 'jobs', 'both').keys()].sort(),
		).toStrictEqual(['api', 'bills', 'jobs', 'postgres']);
	});
});

describe('formatFocusList', () => {
	it('groups the names by hops', () => {
		expect(
			formatFocusList('postgres', 'up', getFocusSet(adjacency, 'postgres', 'up')),
		).toBe(
			[
				'Services that depend on postgres (4):',
				'1 hop: bills',
				'2 hops: api, jobs',
				'3 hops: web',
			].join('\n'),
		);
	});
});

describe('getFocusSet with a hop limit', () => {
	it('stops after the given number of hops', () => {
		expect(
			[...getFocusSet(adjacency, 'postgres', 'up', 1).keys()].sort(),
		).toStrictEqual(['bills', 'postgres']);
	});
});
