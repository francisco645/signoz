/**
 * AI-owned. Generated and maintained by the `signoz-page-story` skill.
 * Do not hand-edit: regenerate instead.
 */

import type {
	IResourceAttribute,
	Tags,
} from 'hooks/useResourceAttribute/types';
import { getResourceDeploymentKeys } from 'hooks/useResourceAttribute/utils';
import type { ServicesList } from 'types/api/metrics/getService';
import type { ServiceMapDependency } from 'types/api/serviceMap/getDependencyGraph';
import type {
	TagKeysPayloadProps,
	TagValuesPayloadProps,
} from 'types/api/metrics/getResourceAttributes';
import { DataTypes } from 'types/api/queryBuilder/queryAutocompleteResponse';

export const SERVICE_HEALTH = ['healthy', 'degraded', 'failing'] as const;

export type ServiceHealth = (typeof SERVICE_HEALTH)[number];

interface Dependency {
	parent: string;
	child: string;
	callCount: number;
	callRate: number;
	/** Nanoseconds: the link tooltip divides by 1e6 to show milliseconds. */
	p99: number;
	environment: string;
	cluster: string;
}

/**
 * One call edge per entry, parents before children, so slicing the head of the
 * list keeps the graph connected instead of leaving orphaned nodes behind.
 */
const DEPENDENCIES: Dependency[] = [
	{
		parent: 'gateway',
		child: 'frontend',
		callCount: 41200,
		callRate: 68.4,
		p99: 184_000_000,
		environment: 'production',
		cluster: 'prod-us-east',
	},
	{
		parent: 'frontend',
		child: 'auth',
		callCount: 12800,
		callRate: 21.3,
		p99: 46_000_000,
		environment: 'production',
		cluster: 'prod-us-east',
	},
	{
		parent: 'frontend',
		child: 'catalogue',
		callCount: 18600,
		callRate: 31,
		p99: 92_000_000,
		environment: 'production',
		cluster: 'prod-us-east',
	},
	{
		parent: 'frontend',
		child: 'cart',
		callCount: 9400,
		callRate: 15.6,
		p99: 58_000_000,
		environment: 'production',
		cluster: 'prod-us-east',
	},
	{
		parent: 'cart',
		child: 'redis',
		callCount: 7300,
		callRate: 12.1,
		p99: 4_000_000,
		environment: 'production',
		cluster: 'prod-us-east',
	},
	{
		parent: 'catalogue',
		child: 'mysql',
		callCount: 15200,
		callRate: 25.3,
		p99: 31_000_000,
		environment: 'production',
		cluster: 'prod-us-east',
	},
	{
		parent: 'auth',
		child: 'mysql',
		callCount: 8100,
		callRate: 13.5,
		p99: 27_000_000,
		environment: 'production',
		cluster: 'prod-us-east',
	},
	{
		parent: 'frontend',
		child: 'checkout',
		callCount: 6200,
		callRate: 10.3,
		p99: 210_000_000,
		environment: 'production',
		cluster: 'prod-us-east',
	},
	{
		parent: 'checkout',
		child: 'payments',
		callCount: 5900,
		callRate: 9.8,
		p99: 340_000_000,
		environment: 'production',
		cluster: 'prod-us-east',
	},
	{
		parent: 'checkout',
		child: 'shipping',
		callCount: 5400,
		callRate: 9,
		p99: 120_000_000,
		environment: 'production',
		cluster: 'prod-us-east',
	},
	{
		parent: 'checkout',
		child: 'kafka',
		callCount: 3100,
		callRate: 5.2,
		p99: 12_000_000,
		environment: 'production',
		cluster: 'prod-us-east',
	},
	{
		parent: 'payments',
		child: 'stripe-proxy',
		callCount: 5100,
		callRate: 8.5,
		p99: 290_000_000,
		environment: 'production',
		cluster: 'prod-us-east',
	},
	{
		parent: 'shipping',
		child: 'geo-service',
		callCount: 4700,
		callRate: 7.8,
		p99: 76_000_000,
		environment: 'production',
		cluster: 'prod-eu-west',
	},
	{
		parent: 'geo-service',
		child: 'redis',
		callCount: 4300,
		callRate: 7.1,
		p99: 3_000_000,
		environment: 'production',
		cluster: 'prod-eu-west',
	},
	{
		parent: 'catalogue',
		child: 'recommendations',
		callCount: 3800,
		callRate: 6.3,
		p99: 150_000_000,
		environment: 'staging',
		cluster: 'staging-eu',
	},
	{
		parent: 'recommendations',
		child: 'ml-inference',
		callCount: 3500,
		callRate: 5.8,
		p99: 480_000_000,
		environment: 'staging',
		cluster: 'staging-eu',
	},
	{
		parent: 'notifications',
		child: 'email-relay',
		callCount: 900,
		callRate: 1.5,
		p99: 65_000_000,
		environment: 'staging',
		cluster: 'staging-eu',
	},
];

export const MAX_DEPENDENCIES = DEPENDENCIES.length;

const DEGRADED_SERVICES = ['payments', 'redis'];

const ERROR_RATES = [1.2, 3.4, 0.8, 6.1, 2.5];

const errorRateFor = (
	child: string,
	health: ServiceHealth,
	index: number,
): number => {
	if (health === 'healthy') {
		return 0;
	}

	if (health === 'degraded' && !DEGRADED_SERVICES.includes(child)) {
		return 0;
	}

	return ERROR_RATES[index % ERROR_RATES.length];
};

const ATTRIBUTE_BY_TAG_KEY: Record<string, 'environment' | 'cluster'> = {
	'deployment.environment': 'environment',
	'k8s.cluster.name': 'cluster',
};

/**
 * The page sends its resource-attribute chips as trace tags, so the response has
 * to narrow with them: a filter that changed nothing would look broken.
 */
const matchesTag = (dependency: Dependency, tag: Tags): boolean => {
	const attribute = ATTRIBUTE_BY_TAG_KEY[tag.Key];

	if (!attribute) {
		return true;
	}

	const matched = tag.StringValues.includes(dependency[attribute]);

	return tag.Operator === 'NotIn' ? !matched : matched;
};

export const TOPOLOGIES = ['demo', 'large'] as const;

export type Topology = (typeof TOPOLOGIES)[number];

interface DependencyGraphOptions {
	topology: Topology;
	count: number;
	health: ServiceHealth;
	tags?: Tags[];
}

const LARGE_SERVICES = 500;
const LARGE_DEPENDENCIES = 1500;

/** Deterministic pseudo-random sequence, so the large topology is the same on every load. */
const sequence = (seed: number): (() => number) => {
	let state = seed;
	return (): number => {
		state = (state * 1_664_525 + 1_013_904_223) % 2 ** 32;
		return state / 2 ** 32;
	};
};

const largeServiceName = (index: number): string =>
	`svc-${String(index).padStart(3, '0')}`;

/**
 * 500 services and 1,500 calls: a tree so every service is reachable, plus
 * random calls on top. It is the size the map has to stay usable at.
 */
const largeTopology = (): ServiceMapDependency[] => {
	const random = sequence(42);
	const seen = new Set<string>();
	const dependencies: ServiceMapDependency[] = [];

	const add = (parent: number, child: number): void => {
		const key = `${parent}>${child}`;
		if (parent === child || seen.has(key)) {
			return;
		}
		seen.add(key);
		const callCount = Math.round(10 + random() * 20_000);
		const roll = random();
		let errorRate = 0;
		if (roll < 0.03) {
			errorRate = 8;
		} else if (roll < 0.08) {
			errorRate = 2;
		}
		dependencies.push({
			parent: largeServiceName(parent),
			child: largeServiceName(child),
			callCount,
			callRate: callCount / 1800,
			errorRate,
			p99: Math.round(2_000_000 + random() * 400_000_000),
		});
	};

	for (let child = 1; child < LARGE_SERVICES; child += 1) {
		add(Math.floor(random() * child), child);
	}
	while (dependencies.length < LARGE_DEPENDENCIES) {
		add(
			Math.floor(random() * LARGE_SERVICES),
			Math.floor(random() * LARGE_SERVICES),
		);
	}

	return dependencies;
};

export const dependencyGraphResponse = ({
	topology,
	count,
	health,
	tags = [],
}: DependencyGraphOptions): ServiceMapDependency[] =>
	topology === 'large'
		? largeTopology()
		: DEPENDENCIES.slice(0, count)
				.filter((dependency) => tags.every((tag) => matchesTag(dependency, tag)))
				.map(({ parent, child, callCount, callRate, p99 }, index) => ({
					parent,
					child,
					callCount,
					callRate,
					p99,
					errorRate: errorRateFor(child, health, index),
				}));

/** Databases and caches have no spans of their own, so `/services` never lists them. */
const DATA_STORES = ['mysql', 'redis', 'kafka'];

/** Yesterday's window: fewer errors and faster, so today's deltas have something to show. */
const YESTERDAY = { calls: 1.05, errors: 0.25, p99: 0.7 };

const DAY_MS = 24 * 60 * 60 * 1000;

/** `/services` is asked for the same window a day earlier when the panel opens. */
export const isYesterdayWindow = (startNs?: string): boolean =>
	!!startNs && Number(startNs) / 1e6 < Date.now() - DAY_MS / 2;

/**
 * RED per service, as `/api/v2/services` reports it: what the callers saw on the
 * way in, plus the root's own traffic for the gateway, which nothing calls.
 */
export const servicesResponse = (
	options: DependencyGraphOptions,
	isYesterday = false,
): { status: string; data: ServicesList[] } => {
	const dependencies = dependencyGraphResponse(options);
	const totals = new Map<
		string,
		{ calls: number; errors: number; rate: number; p99: number }
	>();

	dependencies.forEach(
		({ parent, child, callCount, callRate, errorRate, p99 }) => {
			const callee = totals.get(child) ?? { calls: 0, errors: 0, rate: 0, p99: 0 };
			callee.calls += callCount;
			callee.rate += callRate;
			callee.errors += (callCount * errorRate) / 100;
			callee.p99 = Math.max(callee.p99, p99);
			totals.set(child, callee);

			if (!totals.has(parent)) {
				totals.set(parent, { calls: callCount, errors: 0, rate: callRate, p99 });
			}
		},
	);

	const scale = isYesterday ? YESTERDAY : { calls: 1, errors: 1, p99: 1 };

	return {
		status: 'success',
		data: [...totals.entries()]
			.filter(([serviceName]) => !DATA_STORES.includes(serviceName))
			.map(([serviceName, { calls, errors, rate, p99 }]) => {
				const numCalls = Math.round(calls * scale.calls);
				const numErrors = Math.round(errors * scale.errors);
				return {
					serviceName,
					numCalls,
					numErrors,
					errorRate: numCalls > 0 ? (numErrors / numCalls) * 100 : 0,
					callRate: rate * scale.calls,
					p99: p99 * scale.p99,
					avgDuration: (p99 * scale.p99) / 3,
				};
			}),
	};
};

const ENVIRONMENT_KEY = 'resource_deployment_environment';
const CLUSTER_KEY = 'resource_k8s_cluster_name';
const NAMESPACE_KEY = 'resource_k8s_namespace_name';

/**
 * `service.name` and `host.name` are not in the service-map whitelist, so they
 * are here to be dropped: the page filters the keys it offers down to the three
 * it can send to `/dependency_graph`.
 */
const ATTRIBUTE_KEYS = [
	ENVIRONMENT_KEY,
	CLUSTER_KEY,
	NAMESPACE_KEY,
	'resource_service_name',
	'resource_host_name',
];

const ENVIRONMENTS = [
	'production',
	'staging',
	'development',
	'canary',
	'load-test',
];

const CLUSTERS = ['prod-us-east', 'prod-eu-west', 'staging-eu'];

const NAMESPACES = ['default', 'checkout', 'ingest'];

/**
 * The environment selector asks the same endpoint as the attribute filter, and
 * the deployment key it matches on is the only thing telling the two apart.
 */
export const attributeKeysFor = (searchText: string | null): string[] =>
	searchText === getResourceDeploymentKeys()
		? [getResourceDeploymentKeys()]
		: ATTRIBUTE_KEYS;

export const attributeValuesFor = (
	attributeKey: string | null,
	environments: number,
): string[] => {
	if (
		attributeKey === getResourceDeploymentKeys() ||
		attributeKey === ENVIRONMENT_KEY
	) {
		return ENVIRONMENTS.slice(0, environments);
	}

	if (attributeKey === CLUSTER_KEY) {
		return CLUSTERS;
	}

	return attributeKey === NAMESPACE_KEY ? NAMESPACES : [];
};

export const attributeKeysResponse = (
	keys: readonly string[],
): TagKeysPayloadProps & { status: string } => ({
	status: 'success',
	data: {
		attributeKeys: keys.map((key) => ({
			key,
			type: 'resource',
			dataType: DataTypes.String,
		})),
	},
});

export const attributeValuesResponse = (
	values: readonly string[],
): TagValuesPayloadProps & { status: string } => ({
	status: 'success',
	data: {
		boolAttributeValues: null,
		numberAttributeValues: null,
		stringAttributeValues: [...values],
	},
});

export const RESOURCE_FILTERS = [
	'environment',
	'mixed-environments',
	'cluster',
	'service',
] as const;

export type ResourceFilter = (typeof RESOURCE_FILTERS)[number];

/**
 * The environment query has to carry the deployment key the app derives, since
 * that is what routes it into the environment selector instead of a chip.
 */
const FILTER_QUERIES: Record<ResourceFilter, IResourceAttribute> = {
	environment: {
		id: 'storybook-environment',
		tagKey: getResourceDeploymentKeys(),
		operator: 'IN',
		tagValue: ['production'],
	},
	'mixed-environments': {
		id: 'storybook-mixed-environments',
		tagKey: getResourceDeploymentKeys(),
		operator: 'IN',
		tagValue: ['production', 'staging'],
	},
	cluster: {
		id: 'storybook-cluster',
		tagKey: CLUSTER_KEY,
		operator: 'IN',
		tagValue: ['prod-us-east'],
	},
	service: {
		id: 'storybook-service',
		tagKey: 'resource_service_name',
		operator: 'IN',
		tagValue: ['checkout'],
	},
};

export const resourceFilterQueries = (
	filters: readonly ResourceFilter[],
): IResourceAttribute[] => filters.map((filter) => FILTER_QUERIES[filter]);
