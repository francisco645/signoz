import type { ServiceMapGraph } from 'modules/Servicemap/types';

import { applyHomeBands, getFocusSet } from '../homeGraph';

const node = (
	id: string,
	band: ServiceMapGraph['nodes'][number]['band'] = 'critical',
) => ({
	id,
	kind: 'service' as const,
	band,
	incoming: { callCount: 0, errorCount: 0, callRate: 0, errorRate: 0 },
	x: 10,
	y: 20,
});
const link = (source: string, target: string) => ({
	source,
	target,
	callCount: 1,
	callRate: 1,
	errorRate: 9,
	p99: 0,
	band: 'critical' as const,
	colorBand: 'critical' as const,
	isBidirectional: false,
});
const graph: ServiceMapGraph = {
	nodes: [
		node('web'),
		node('checkout'),
		node('payments'),
		node('idle', 'noData'),
	],
	links: [link('web', 'checkout'), link('checkout', 'payments')],
};

describe('applyHomeBands', () => {
	it('colours by the Home marks, keeps positions and leaves the input alone', () => {
		const result = applyHomeBands(
			graph,
			new Map([['payments', 'critical' as const]]),
		);
		expect(result.nodes.map((n) => n.band)).toStrictEqual([
			'healthy',
			'healthy',
			'critical',
			'noData',
		]);
		expect(result.links.map((l) => l.colorBand)).toStrictEqual([
			'healthy',
			'critical',
		]);
		expect(result.nodes[0].x).toBe(10);
		expect(graph.nodes[0].band).toBe('critical');
	});
});

describe('getFocusSet', () => {
	it('is the affected services and their neighbours', () => {
		expect(
			[...(getFocusSet(graph, new Set(['payments'])) ?? [])].sort(),
		).toStrictEqual(['checkout', 'payments']);
	});

	it('shows the whole map when nothing on it is affected', () => {
		expect(getFocusSet(graph, new Set())).toBeUndefined();
		expect(getFocusSet(graph, new Set(['not-on-map']))).toBeUndefined();
	});
});
