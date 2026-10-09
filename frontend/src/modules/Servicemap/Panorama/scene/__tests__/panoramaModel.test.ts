import type { ServiceMapGraph } from '../../../types';
import {
	buildPanoramaModel,
	getPanoramaPositions,
	getPanoramaHealth,
	getPanoramaParticleCount,
	getPanoramaParticlePace,
} from '../panoramaModel';

const graph: ServiceMapGraph = {
	nodes: [
		{
			id: 'gateway',
			kind: 'service',
			band: 'healthy',
			metrics: {
				callCount: 1000,
				errorCount: 0,
				callRate: 10,
				errorRate: 0,
				p99: 0,
			},
			incoming: { callCount: 0, errorCount: 0, callRate: 0, errorRate: 0 },
		},
		{
			id: 'mysql',
			kind: 'database',
			band: 'critical',
			incoming: { callCount: 500, errorCount: 50, callRate: 5, errorRate: 10 },
		},
	],
	links: [
		{
			source: 'gateway',
			target: 'mysql',
			callCount: 500,
			callRate: 5,
			errorRate: 10,
			p99: 0,
			band: 'critical',
			colorBand: 'critical',
			isBidirectional: false,
		},
	],
};

describe('buildPanoramaModel', () => {
	it('puts each node on its plane with its traffic and a position', () => {
		const model = buildPanoramaModel(
			graph,
			getPanoramaPositions(graph),
			new Map([
				['gateway', { tier: 'entry' as const, source: 'inferred' }],
				['mysql', { tier: 'data' as const, source: 'inferred' }],
			]),
		);
		expect(
			model.nodes.map(({ id, tier, callRate, band }) => ({
				id,
				tier,
				callRate,
				band,
			})),
		).toStrictEqual([
			{ id: 'gateway', tier: 'entry', callRate: 10, band: 'healthy' },
			{ id: 'mysql', tier: 'data', callRate: 5, band: 'critical' },
		]);
		model.nodes.forEach((node) => {
			expect(Number.isFinite(node.x) && Number.isFinite(node.y)).toBe(true);
		});
		expect(model.links).toStrictEqual([
			{ source: 'gateway', target: 'mysql', callRate: 5, colorBand: 'critical' },
		]);
	});
});

describe('panorama encodings', () => {
	it('colours only degraded and critical bands', () => {
		expect(getPanoramaHealth('critical')).toBe('critical');
		expect(getPanoramaHealth('degraded')).toBe('degraded');
		expect(getPanoramaHealth('lowTraffic')).toBe('neutral');
		expect(getPanoramaHealth('noData')).toBe('neutral');
	});

	it('runs more and faster particles on busier edges, within bounds', () => {
		expect(getPanoramaParticleCount(0)).toBe(1);
		expect(getPanoramaParticleCount(1_000_000)).toBe(4);
		expect(getPanoramaParticlePace(100)).toBeGreaterThan(
			getPanoramaParticlePace(1),
		);
		expect(getPanoramaParticlePace(1_000_000)).toBe(getPanoramaParticlePace(100));
	});
});

describe('getPanoramaPositions', () => {
	it('places nodes from the inferred planes only', () => {
		expect(getPanoramaPositions(graph)).toStrictEqual(
			getPanoramaPositions(graph),
		);
	});
});
