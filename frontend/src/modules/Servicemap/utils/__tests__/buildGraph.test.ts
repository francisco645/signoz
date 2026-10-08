import type { ServicesList } from 'types/api/metrics/getService';
import type { ServiceMapDependency } from 'types/api/serviceMap/getDependencyGraph';

import { buildGraph, getNodePositions } from '../buildGraph';

const dependency = (
	parent: string,
	child: string,
	callCount: number,
	errorRate: number,
): ServiceMapDependency => ({
	parent,
	child,
	callCount,
	callRate: callCount / 60,
	errorRate,
	p99: 1_000_000,
});

const service = (
	serviceName: string,
	numCalls: number,
	errorRate: number,
): ServicesList => ({
	serviceName,
	numCalls,
	numErrors: Math.round((numCalls * errorRate) / 100),
	errorRate,
	callRate: numCalls / 60,
	p99: 2_000_000,
	avgDuration: 1_000_000,
});

describe('buildGraph', () => {
	it("takes a node's health from the service's own spans", () => {
		const { nodes } = buildGraph(
			[dependency('gateway', 'cart', 1000, 0)],
			[service('gateway', 1000, 6), service('cart', 1000, 2)],
		);

		expect(nodes.find((node) => node.id === 'gateway')).toMatchObject({
			band: 'critical',
			metrics: { callCount: 1000, errorRate: 6 },
		});
		expect(nodes.find((node) => node.id === 'cart')?.band).toBe('degraded');
	});

	it('draws nodes without spans of their own as no data', () => {
		const { nodes } = buildGraph(
			[dependency('cart', 'redis', 500, 30)],
			[service('cart', 500, 0)],
		);

		expect(nodes.find((node) => node.id === 'redis')).toMatchObject({
			band: 'noData',
			metrics: undefined,
		});
	});

	it('weights the incoming error rate by the calls on each edge', () => {
		const { nodes } = buildGraph([
			dependency('a', 'target', 100, 10),
			dependency('b', 'target', 900, 0),
		]);

		expect(nodes.find((node) => node.id === 'target')?.incoming).toMatchObject({
			callCount: 1000,
			errorCount: 10,
		});
		expect(
			nodes.find((node) => node.id === 'target')?.incoming.errorRate,
		).toBeCloseTo(1);
	});

	it('never reports more than 100% incoming errors', () => {
		const { nodes } = buildGraph([
			dependency('a', 'target', 10, 40),
			dependency('b', 'target', 10, 40),
			dependency('c', 'target', 10, 40),
		]);

		expect(
			nodes.find((node) => node.id === 'target')?.incoming.errorRate,
		).toBeCloseTo(40);
	});

	it('classifies each link by its own error rate and volume', () => {
		const { links } = buildGraph([
			dependency('a', 'b', 1000, 7),
			dependency('a', 'c', 10, 50),
			dependency('a', 'd', 1000, 0.2),
		]);

		expect(links.map((link) => link.band)).toStrictEqual([
			'critical',
			'lowTraffic',
			'healthy',
		]);
	});

	it('marks the links of a pair that call each other', () => {
		const { links } = buildGraph([
			dependency('a', 'b', 1, 0),
			dependency('b', 'a', 1, 0),
			dependency('a', 'c', 1, 0),
		]);

		expect(
			links.map((link) => [link.source, link.target, link.isBidirectional]),
		).toStrictEqual([
			['a', 'b', true],
			['a', 'c', false],
			['b', 'a', true],
		]);
	});

	it('returns nodes and links in the same order whatever the input order', () => {
		const dependencies = [
			dependency('b', 'c', 1, 0),
			dependency('a', 'b', 1, 0),
			dependency('a', 'c', 1, 0),
		];

		const first = buildGraph(dependencies);
		const second = buildGraph([...dependencies].reverse());

		expect(first.nodes.map((node) => node.id)).toStrictEqual(['a', 'b', 'c']);
		expect(second).toStrictEqual(first);
	});

	it('keeps the positions of nodes that were already laid out', () => {
		const previous = buildGraph([dependency('a', 'b', 1, 0)]);
		previous.nodes[0].x = 10;
		previous.nodes[0].y = 20;

		const { nodes } = buildGraph(
			[dependency('a', 'b', 1, 0), dependency('a', 'c', 1, 0)],
			[],
			getNodePositions(previous.nodes),
		);

		expect(nodes.find((node) => node.id === 'a')).toMatchObject({ x: 10, y: 20 });
		expect(nodes.find((node) => node.id === 'c')?.x).toBeUndefined();
	});

	it('returns an empty graph for no dependencies', () => {
		expect(buildGraph([])).toStrictEqual({ nodes: [], links: [] });
	});
});
