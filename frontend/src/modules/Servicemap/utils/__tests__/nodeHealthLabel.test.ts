import { getNodeHealthLabel } from '../nodeHealthLabel';

describe('getNodeHealthLabel', () => {
	it('uses the map wording by default', () => {
		expect(getNodeHealthLabel({ kind: 'service', band: 'critical' })).toBe(
			getNodeHealthLabel({ kind: 'service', band: 'critical' }, {}),
		);
	});

	it('takes the wording an embedding page gives', () => {
		const labels = { healthy: 'Within usual range' };
		expect(getNodeHealthLabel({ kind: 'service', band: 'healthy' }, labels)).toBe(
			'Within usual range',
		);
		expect(
			getNodeHealthLabel({ kind: 'database', band: 'healthy' }, labels),
		).toBe('Database · Within usual range');
	});
});
