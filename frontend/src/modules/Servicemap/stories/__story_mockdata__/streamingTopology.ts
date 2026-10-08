import type { ServiceMapDependency } from 'types/api/serviceMap/getDependencyGraph';

const WINDOW_S = 1800;
const MS = 1_000_000;

interface Domain {
	/** Front service of the domain, called by the graph API. */
	front: string;
	services: string[];
	stores: string[];
}

/**
 * A video streaming platform at scale, in the shape large streaming services
 * describe in public talks: device gateways, a graph API fanning out to
 * domains, each with its services, caches and wide-column stores.
 */
const DOMAINS: Domain[] = [
	{
		front: 'playback-api',
		services: [
			'license-service',
			'drm-service',
			'drm-key-rotation',
			'steering-service',
			'manifest-service',
			'stream-selector',
			'bitrate-ladder',
			'subtitle-service',
			'audio-track-service',
			'bookmarks',
			'device-capabilities',
			'qoe-telemetry',
			'cdn-health',
			'playback-events',
			'session-heartbeat',
			'concurrent-streams',
			'download-service',
			'offline-license',
			'trick-play',
			'intro-detector',
			'playback-ab-router',
			'error-classifier',
			'startup-optimizer',
			'stream-limits',
		],
		stores: [
			'cassandra-licenses',
			'cassandra-viewing',
			'evcache-playback',
			'open-connect',
			'kafka',
			'cassandra-heartbeats',
		],
	},
	{
		front: 'discovery-api',
		services: [
			'recommendations',
			'personalization-ml',
			'row-ranker',
			'artwork-service',
			'artwork-personalizer',
			'continue-watching',
			'trending',
			'top10',
			'search-service',
			'search-suggest',
			'catalog-service',
			'title-metadata',
			'genre-service',
			'maturity-filter',
			'localization',
			'previews-service',
			'similar-titles',
			'billboard-service',
			'home-page-builder',
			'kids-rows',
			'new-releases',
			'coming-soon',
			'collections-service',
			'because-you-watched',
			'cold-start-ranker',
			'feature-store-api',
			'model-serving',
			'embedding-service',
		],
		stores: [
			'cassandra-catalog',
			'evcache-catalog',
			'evcache-recs',
			'elasticsearch',
			'feature-store',
			's3-artwork',
			'druid-trending',
			'cassandra-rows',
		],
	},
	{
		front: 'member-api',
		services: [
			'identity-service',
			'auth-gateway',
			'profile-service',
			'my-list',
			'ratings',
			'parental-controls',
			'household-service',
			'device-registry',
			'notifications',
			'email-service',
			'push-gateway',
			'account-settings',
			'password-reset',
			'mfa-service',
			'session-service',
			'profile-lock',
			'language-prefs',
			'viewing-activity',
			'sharing-detection',
			'extra-member',
			'kids-profile',
			'avatar-service',
		],
		stores: [
			'cassandra-identity',
			'cassandra-profiles',
			'evcache-identity',
			'evcache-profiles',
			'cassandra-devices',
			'sendgrid-api',
		],
	},
	{
		front: 'billing-api',
		services: [
			'billing-service',
			'invoice-service',
			'tax-service',
			'plans-service',
			'fraud-scoring',
			'gift-cards',
			'promo-service',
			'payment-router',
			'retry-scheduler',
			'dunning-service',
			'partner-billing',
			'currency-service',
			'chargeback-service',
			'receipt-service',
		],
		stores: [
			'mysql-billing',
			'payments-provider',
			'cassandra-billing',
			'tax-provider',
		],
	},
	{
		front: 'studio-api',
		services: [
			'content-ingest',
			'encoding-orchestrator',
			'encoder-workers',
			'asset-manager',
			'metadata-ingest',
			'rights-management',
			'dubbing-service',
			'qc-service',
			'subtitle-authoring',
			'packaging-service',
			'dynamic-optimizer',
			'artwork-ingest',
			'launch-planner',
			'title-scheduler',
			'vendor-portal',
			'audio-mixer',
			'color-pipeline',
			'archive-service',
		],
		stores: ['s3-masters', 's3-encodes', 'cassandra-assets', 'mysql-rights'],
	},
	{
		front: 'platform-api',
		services: [
			'config-service',
			'feature-flags',
			'experiment-service',
			'rate-limiter',
			'audit-log',
			'canary-analysis',
			'deploy-hooks',
			'secrets-service',
			'service-discovery',
			'quota-service',
			'geo-service',
			'ip-intel',
			'telemetry-router',
			'alerting-service',
			'cost-allocator',
			'chaos-controller',
		],
		stores: [
			'cassandra-config',
			'evcache-flags',
			'atlas-metrics',
			'cassandra-audit',
		],
	},
];

const ENTRY = [
	'edge-gateway',
	'tv-device-gateway',
	'mobile-gateway',
	'web-gateway',
	'partner-gateway',
	'game-gateway',
];

/** Fails, which takes playback down; its neighbours degrade. */
const ERRORS: Record<string, number> = {
	'license-service': 11.8,
	'playback-api': 9.6,
	'offline-license': 7.2,
	'drm-service': 3.1,
	'drm-key-rotation': 2.2,
	'evcache-catalog': 2.4,
	'personalization-ml': 1.2,
	'tax-provider': 1.8,
};

/** Calls into the platform domain that every other domain makes. */
const SHARED = [
	'feature-flags',
	'experiment-service',
	'rate-limiter',
	'identity-service',
];

const sequence = (seed: number): (() => number) => {
	let state = seed >>> 0;
	return (): number => {
		state = (state * 1_664_525 + 1_013_904_223) >>> 0;
		return state / 2 ** 32;
	};
};

export const STREAMING_DATA_STORES = DOMAINS.flatMap((domain) => domain.stores);

const buildCalls = (): [string, string, number][] => {
	const random = sequence(13088);
	const calls = new Map<string, [string, string, number]>();
	const call = (parent: string, child: string, rate: number): void => {
		if (parent !== child && !calls.has(`${parent}>${child}`)) {
			calls.set(`${parent}>${child}`, [parent, child, Math.max(0.2, rate)]);
		}
	};
	const pick = <T>(list: T[]): T => list[Math.floor(random() * list.length)];

	ENTRY.forEach((gateway, index) => {
		const share = 1600 / (index + 1);
		call(gateway, 'graph-api', share);
		call(gateway, 'auth-gateway', share / 3);
	});
	// Probes reach the gateways under 5% of their calls: they stay on the entry plane.
	ENTRY.forEach((gateway) => call('chaos-monkey', gateway, 1));
	call('chaos-monkey', 'chaos-controller', 2);

	DOMAINS.forEach((domain) => {
		const domainRate = 300 + random() * 900;
		call('graph-api', domain.front, domainRate);
		domain.services.forEach((service, index) => {
			const rate = (domainRate / (1 + index * 0.35)) * (0.4 + random());
			call(domain.front, service, rate);
			for (let i = 0; i < 1 + Math.floor(random() * 2); i += 1) {
				call(service, pick(domain.services), rate * (0.2 + random() * 0.5));
			}
			call(service, pick(domain.stores), rate * (0.8 + random()));
			if (random() < 0.35) {
				call(service, pick(SHARED), rate * 0.3);
			}
		});
		call(domain.front, pick(SHARED), domainRate * 0.4);
	});
	// The incident path, kept explicit.
	call('playback-api', 'license-service', 480);
	call('license-service', 'drm-service', 470);
	call('license-service', 'cassandra-licenses', 470);
	call('catalog-service', 'evcache-catalog', 2600);
	call('recommendations', 'personalization-ml', 600);
	return [...calls.values()];
};

export const streamingTopology = (): ServiceMapDependency[] =>
	buildCalls().map(([parent, child, rate]) => ({
		parent,
		child,
		callCount: Math.round(rate * WINDOW_S),
		callRate: Math.round(rate * 10) / 10,
		errorRate: ERRORS[child] ?? 0,
		p99: (ERRORS[child] ? 400 : 20 + (child.length % 9) * 15) * MS,
	}));
