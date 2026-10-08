import type { ServicesList } from 'types/api/metrics/getService';
import type { ServiceMapDependency } from 'types/api/serviceMap/getDependencyGraph';

import { buildGraph } from '../buildGraph';
import { formatDelta, getServiceDeltas, isWorseChange } from '../delta';
import {
	buildNodeExpression,
	buildScopeExpression,
	getServicePageLink,
	getTracesLink,
} from '../explorerLinks';
import { getNeighbours } from '../neighbours';

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
	numCalls: number,
	errorRate: number,
	p99: number,
): ServicesList => ({
	serviceName: 'cart',
	numCalls,
	numErrors: 0,
	errorRate,
	callRate: numCalls / 60,
	p99,
	avgDuration: 0,
});

describe('getNeighbours', () => {
	const graph = buildGraph([
		dependency('gateway', 'cart', 1000, 1),
		dependency('checkout', 'cart', 100, 50),
		dependency('cart', 'redis', 500, 0),
	]);

	it('ranks callers by failed calls on the link', () => {
		expect(
			getNeighbours(graph, 'cart', 'callers').map((row) => row.id),
		).toStrictEqual(['checkout', 'gateway']);
	});

	it('lists callees', () => {
		expect(getNeighbours(graph, 'cart', 'callees')).toMatchObject([
			{ id: 'redis', callCount: 500, errorCount: 0 },
		]);
	});
});

describe('getServiceDeltas', () => {
	it('reports error changes in percentage points and the rest as relative change', () => {
		expect(
			getServiceDeltas(service(1100, 6, 300), service(1000, 1, 200)),
		).toStrictEqual({ callRate: expect.closeTo(10, 5), errorRate: 5, p99: 50 });
	});

	it('reports nothing when yesterday had too few calls', () => {
		expect(getServiceDeltas(service(1000, 5, 1), service(3, 0, 1))).toStrictEqual(
			{},
		);
	});

	it('formats deltas with their sign', () => {
		expect(formatDelta(5.94, 'pp')).toBe('+5.9 pp');
		expect(formatDelta(-12.4, 'pct')).toBe('-12%');
	});
});

describe('explorer links', () => {
	const scope = buildScopeExpression([
		{
			id: 'env',
			tagKey: 'resource_deployment.environment',
			operator: 'IN',
			tagValue: ['prod'],
		},
		{
			id: 'ns',
			tagKey: 'resource_k8s_namespace_name',
			operator: 'Not IN',
			tagValue: ['kube-system', 'monitoring'],
		},
	]);
	const window = { minTime: 1_000_000_000_000, maxTime: 2_000_000_000_000 };

	it('turns the map filters into a query expression', () => {
		expect(scope).toBe(
			"deployment.environment IN ('prod') AND k8s.namespace.name NOT IN ('kube-system', 'monitoring')",
		);
	});

	it('filters services by name and data stores by technology', () => {
		expect(buildNodeExpression('cart', true, scope)).toBe(
			`service.name = 'cart' AND ${scope}`,
		);
		expect(buildNodeExpression('redis', false, '')).toBe(
			"(db.system = 'redis' OR messaging.system = 'redis')",
		);
	});

	it('opens the traces explorer on the same absolute window', () => {
		const url = new URL(
			getTracesLink("service.name = 'cart'", window),
			'http://x',
		);
		const query = JSON.parse(url.searchParams.get('compositeQuery') ?? '{}');

		expect(url.pathname).toBe('/traces-explorer');
		expect(url.searchParams.get('startTime')).toBe('1000000');
		expect(url.searchParams.get('endTime')).toBe('2000000');
		expect(query.builder.queryData[0].filter.expression).toBe(
			"service.name = 'cart'",
		);
	});

	it('links to the service page with the map filters', () => {
		expect(getServicePageLink('my svc', [], window)).toMatch(
			/^\/services\/my%20svc\?startTime=1000000&endTime=2000000&resourceAttribute=/,
		);
	});
});

describe('isWorseChange', () => {
	it('treats a big traffic drop as bad news', () => {
		expect(isWorseChange(-60, 'bothAreWorse')).toBe(true);
		expect(isWorseChange(-10, 'bothAreWorse')).toBe(false);
		expect(isWorseChange(-60, 'higherIsWorse')).toBe(false);
		expect(isWorseChange(5, 'higherIsWorse')).toBe(true);
	});
});
