import type { HealthBand, ServiceMapNode } from '../../types';
import { searchNodes } from '../search';

const node = (id: string, band: HealthBand): ServiceMapNode => ({
	id,
	band,
	incoming: { callCount: 0, errorCount: 0, callRate: 0, errorRate: 0 },
});

const nodes = [
	node('core-bills-jobs', 'healthy'),
	node('bill-audits', 'lowTraffic'),
	node('core-bills', 'critical'),
	node('cart', 'critical'),
];

describe('searchNodes', () => {
	it('puts prefix matches first, then the worst health', () => {
		expect(searchNodes(nodes, 'bill', 10).map((n) => n.id)).toStrictEqual([
			'bill-audits',
			'core-bills',
			'core-bills-jobs',
		]);
	});

	it('ignores case and blank queries', () => {
		expect(searchNodes(nodes, 'CART', 10)).toHaveLength(1);
		expect(searchNodes(nodes, '  ', 10)).toStrictEqual([]);
	});
});
