import { PLANE_ATTRIBUTE, resolvePlanes } from '../planes';
import type { InferredTier } from '../tiers';

const inferred = new Map<string, InferredTier>([
	['gateway', { tier: 'entry', reason: { kind: 'noCaller' } }],
	[
		'worker',
		{
			tier: 'internal',
			reason: { kind: 'calledBy', caller: 'gateway', share: 0.6 },
		},
	],
	['mysql', { tier: 'data', reason: { kind: 'dataStore' } }],
]);

describe('resolvePlanes', () => {
	it('uses the inference when nothing is declared or adjusted', () => {
		const planes = resolvePlanes(inferred, new Map(), new Map());
		expect(planes.get('worker')).toMatchObject({
			tier: 'internal',
			source: 'inferred',
		});
	});

	it('takes what the service declares over the inference', () => {
		const planes = resolvePlanes(
			inferred,
			new Map([['worker', ' Entry ']]),
			new Map(),
		);
		expect(planes.get('worker')).toMatchObject({
			tier: 'entry',
			source: 'declared',
			declared: 'entry',
		});
	});

	it('takes your adjustment over the declared plane, keeping the declared one to show', () => {
		const planes = resolvePlanes(
			inferred,
			new Map([['worker', 'entry']]),
			new Map([['worker', 'data']]),
		);
		expect(planes.get('worker')).toMatchObject({
			tier: 'data',
			source: 'adjusted',
			declared: 'entry',
		});
	});

	it('ignores values that are not plane names', () => {
		const planes = resolvePlanes(
			inferred,
			new Map([['worker', 'backend']]),
			new Map(),
		);
		expect(planes.get('worker')).toMatchObject({
			tier: 'internal',
			source: 'inferred',
			invalidDeclared: 'backend',
		});
	});

	it('keeps databases and queues on the data plane', () => {
		const planes = resolvePlanes(
			inferred,
			new Map([['mysql', 'entry']]),
			new Map([['mysql', 'entry']]),
		);
		expect(planes.get('mysql')).toMatchObject({
			tier: 'data',
			source: 'inferred',
		});
	});

	it('names the attribute services set', () => {
		expect(PLANE_ATTRIBUTE).toBe('signoz.service_map.layer');
	});
});
