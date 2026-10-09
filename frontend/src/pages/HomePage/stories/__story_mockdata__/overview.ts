import type { ServicesList } from 'types/api/metrics/getService';
import type { ServiceMapDependency } from 'types/api/serviceMap/getDependencyGraph';

export const SCENARIOS = ['normal', 'degraded', 'incident', 'blind'] as const;
export type Scenario = (typeof SCENARIOS)[number];

export const FAILING_SOURCES = [
	'alerts',
	'rules',
	'services',
	'telemetry',
	'map',
] as const;
export type FailingSource = (typeof FAILING_SOURCES)[number];

export const ALERT_ENVIRONMENTS = ['production', 'staging', 'none'] as const;
export type AlertEnvironment = (typeof ALERT_ENVIRONMENTS)[number];

const MS = 1_000_000;
const WINDOW_S = 900;

/** [caller, callee, calls in 15 min] */
const EDGES: [string, string, number][] = [
	['frontend-web', 'search-service', 40_000],
	['frontend-web', 'catalog-api', 90_000],
	['frontend-web', 'recommendation-api', 9_000],
	['frontend-web', 'checkout-api', 167_000],
	['frontend-web', 'cart-service', 60_000],
	['catalog-api', 'catalog-db', 85_000],
	['checkout-api', 'inventory-service', 30_000],
	['inventory-service', 'catalog-db', 28_000],
	['checkout-api', 'payment-service', 128_000],
	['payment-service', 'stripe', 120_000],
	['payment-service', 'orders-db', 125_000],
	['checkout-api', 'shipping-quote', 50_000],
	['checkout-api', 'order-events', 70_000],
	['order-events', 'notification-worker', 65_000],
	['cart-service', 'redis', 58_000],
];

const STORES = ['catalog-db', 'orders-db', 'redis', 'stripe', 'order-events'];

/** Error % and p99 ms per service: [now, a week ago]. */
const RED: Record<
	Scenario,
	Record<string, [number, number, number, number]>
> = {
	normal: {},
	degraded: { 'frontend-web': [1.9, 0.5, 1120, 540] },
	incident: {
		'frontend-web': [1.9, 0.5, 1120, 540],
		'payment-service': [6.8, 0.2, 2340, 410],
		'checkout-api': [4.1, 0.3, 2910, 620],
	},
	blind: {},
};

export const dependencyGraph = (scenario: Scenario): ServiceMapDependency[] =>
	EDGES.map(([parent, child, calls]) => {
		const [errorRate = 0.2, , p99 = 120] = RED[scenario][child] ?? [];
		return {
			parent,
			child,
			callCount: calls,
			callRate: calls / WINDOW_S,
			errorRate,
			p99: p99 * MS,
		};
	});

export const services = (
	scenario: Scenario,
	isWeekAgo: boolean,
): ServicesList[] => {
	const names = [
		...new Set(EDGES.flatMap(([parent, child]) => [parent, child])),
	].filter((name) => !STORES.includes(name));
	return names.map((name) => {
		const calls =
			EDGES.filter(([, child]) => child === name).reduce(
				(sum, [, , c]) => sum + c,
				0,
			) || 180_000;
		const red = RED[scenario][name];
		const errorRate = red ? red[isWeekAgo ? 1 : 0] : 0.2;
		const p99 = red ? red[isWeekAgo ? 3 : 2] : 120 + (name.length % 7) * 40;
		return {
			serviceName: name,
			numCalls: calls,
			callRate: calls / WINDOW_S,
			numErrors: Math.round((calls * errorRate) / 100),
			errorRate,
			p99: p99 * MS,
			avgDuration: (p99 / 3) * MS,
		};
	});
};

interface MockAlert {
	name: string;
	service: string;
	severity: 'critical' | 'warning';
	minutesAgo: number;
	value: string;
}

const ALERTS: Record<Scenario, MockAlert[]> = {
	normal: [],
	degraded: [
		{
			name: 'Consumer lag > 10k',
			service: 'order-events',
			severity: 'warning',
			minutesAgo: 23,
			value: '14.2k',
		},
	],
	incident: [
		{
			name: 'Error rate > 2%',
			service: 'payment-service',
			severity: 'critical',
			minutesAgo: 8,
			value: '6.8%',
		},
		{
			name: 'p99 latency > 2 s',
			service: 'checkout-api',
			severity: 'critical',
			minutesAgo: 6,
			value: '2.91 s',
		},
		{
			name: 'Consumer lag > 10k',
			service: 'order-events',
			severity: 'warning',
			minutesAgo: 23,
			value: '14.2k',
		},
	],
	blind: [],
};

export const alerts = (
	scenario: Scenario,
	environment: AlertEnvironment,
): unknown[] =>
	ALERTS[scenario].map((alert) => ({
		labels: {
			alertname: alert.name,
			severity: alert.severity,
			'service.name': alert.service,
			ruleId: alert.name,
			...(environment === 'none' ? {} : { 'deployment.environment': environment }),
		},
		annotations: {
			description: `${alert.name} (current value: ${alert.value}) crosses the threshold`,
		},
		startsAt: new Date(Date.now() - alert.minutesAgo * 60_000).toISOString(),
		status: { state: 'active', silencedBy: [], inhibitedBy: [] },
		fingerprint: alert.name,
	}));

export const rules = (scenario: Scenario): unknown[] => {
	const names = [
		'Error rate > 2%',
		'p99 latency > 2 s',
		'Apdex < 0.8',
		'Consumer lag > 10k',
		'Disk usage > 85%',
	];
	return names.map((alert, index) => ({
		id: String(index + 1),
		alert,
		state: scenario === 'blind' && index < 3 ? 'nodata' : 'inactive',
		labels: {
			'service.name': [
				'payment-service',
				'checkout-api',
				'frontend-web',
				'order-events',
				'catalog-db',
			][index],
		},
		updatedAt: new Date(Date.now() - 14 * 60_000).toISOString(),
		condition: {},
	}));
};

const series = (
	perMinute: number,
	minutes: number,
	stepS = 60,
): Record<string, unknown> => ({
	aggregations: [
		{
			index: 0,
			series: [
				{
					labels: [],
					values: Array.from({ length: minutes }, (_, i) => ({
						timestamp: Date.now() - (minutes - i) * stepS * 1000,
						value: perMinute,
					})),
				},
			],
		},
	],
});

/** Per-minute counts for the four telemetry queries (A traces, B logs, C/D a week ago). */
export const telemetry = (scenario: Scenario): Record<string, unknown> => {
	const traces = scenario === 'blind' ? 0 : 12_000;
	const logs = scenario === 'incident' ? 9_600 : 20_000;
	return {
		status: 'success',
		data: {
			type: 'time_series',
			data: {
				results: [
					{ queryName: 'A', ...(series(traces, 15) as object) },
					{ queryName: 'B', ...(series(logs, 15) as object) },
					{ queryName: 'C', ...(series(12_000, 15) as object) },
					{ queryName: 'D', ...(series(20_000, 15) as object) },
				],
			},
		},
	};
};

/** Traces in five-minute buckets over six hours, stopping 14 minutes ago when blind. */
export const lastTraces = (): Record<string, unknown> => ({
	status: 'success',
	data: {
		type: 'time_series',
		data: {
			results: [
				{
					queryName: 'A',
					aggregations: [
						{
							index: 0,
							series: [
								{
									labels: [],
									values: Array.from({ length: 72 }, (_, i) => ({
										timestamp: Date.now() - (72 - i) * 300_000,
										value: i < 69 ? 50_000 : 0,
									})),
								},
							],
						},
					],
				},
			],
		},
	},
});

export const scalar = (
	columns: string[],
	rows: unknown[][],
): Record<string, unknown> => ({
	status: 'success',
	data: {
		type: 'scalar',
		data: {
			results: [{ columns: columns.map((name) => ({ name })), data: rows }],
		},
	},
});
