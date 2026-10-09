import type { ServiceSample } from '../../types/home';
import { compareServices, isOutsideUsualRange } from '../outsideRange';

const sample = (overrides: Partial<ServiceSample>): ServiceSample => ({
	name: 'checkout',
	calls: 1000,
	errors: 5,
	errorRate: 0.5,
	p99Ns: 300_000_000,
	...overrides,
});

const compare = (
	now: Partial<ServiceSample>,
	weekAgo?: Partial<ServiceSample>,
) => compareServices([sample(now)], weekAgo ? [sample(weekAgo)] : [], 900)[0];

describe('compareServices', () => {
	it('flags errors that doubled and rose a point', () => {
		const result = compare(
			{ errors: 40, errorRate: 4 },
			{ errors: 5, errorRate: 0.5 },
		);
		expect(result.reasons).toStrictEqual(['errors']);
		expect(isOutsideUsualRange(result)).toBe(true);
	});

	it('flags latency that doubled by at least 100 ms', () => {
		expect(compare({ p99Ns: 900_000_000 }).reasons).toStrictEqual([]);
		expect(compare({ p99Ns: 900_000_000 }, {}).reasons).toStrictEqual([
			'latency',
		]);
	});

	it.each([
		[
			'few errors from zero',
			{ errors: 2, errorRate: 2 },
			{ errors: 0, errorRate: 0 },
		],
		[
			'latency doubled from almost nothing',
			{ p99Ns: 4_000_000 },
			{ p99Ns: 2_000_000 },
		],
		['no server p99', { p99Ns: 0 }, {}],
		['low volume now', { calls: 10, errors: 9, errorRate: 90 }, {}],
		['no baseline', { errors: 40, errorRate: 4 }, undefined],
		['small baseline', { errors: 40, errorRate: 4 }, { calls: 10 }],
	])('does not flag %s', (_, now, weekAgo) => {
		expect(isOutsideUsualRange(compare(now, weekAgo))).toBe(false);
	});

	it('orders by the rise in errors per second, then by name', () => {
		const result = compareServices(
			[
				sample({ name: 'b', errors: 50 }),
				sample({ name: 'a', errors: 50 }),
				sample({ name: 'c', errors: 90 }),
			],
			[],
			10,
		);
		expect(result.map((item) => item.name)).toStrictEqual(['c', 'a', 'b']);
		expect(result[0].deltaErrorsPerSec).toBe(9);
	});
});
