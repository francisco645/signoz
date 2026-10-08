import type { ServicesList } from 'types/api/metrics/getService';
import type { ServiceMapDependency } from 'types/api/serviceMap/getDependencyGraph';

import type {
	HealthBand,
	ServiceMapGraph,
	ServiceMapLink,
	ServiceMapNode,
	ServiceMetrics,
} from '../types';
import { BAND_SEVERITY, getHealthBand, isAlerting } from './health';
import { getNodeKind } from './nodeKind';

type Position = Pick<ServiceMapNode, 'x' | 'y' | 'vx' | 'vy'>;

interface ServiceNodeTotals {
	callCount: number;
	errorCount: number;
	callRate: number;
}

const compareIds = (a: string, b: string): number =>
	a < b ? -1 : Number(a > b);

const toMetrics = (service: ServicesList): ServiceMetrics => ({
	callCount: service.numCalls,
	errorCount: service.numErrors,
	callRate: service.callRate,
	errorRate: service.errorRate,
	p99: service.p99,
});

/**
 * Nodes and links are sorted by id: d3-force places nodes without a position by
 * their index, so the same data always draws the same layout.
 *
 * A service's health comes from its own spans (`services`). Databases and queues
 * have none, so they take the worst band among the calls into them: a failing
 * redis turns red, not only the arrow pointing at it. Client-only services have
 * no spans and no measured calls into them, so they are drawn as no data.
 */
export const buildGraph = (
	dependencies: ServiceMapDependency[],
	services: ServicesList[] = [],
	previousPositions: ReadonlyMap<string, Position> = new Map(),
): ServiceMapGraph => {
	const servicesByName = new Map(
		services.map((service) => [service.serviceName, service]),
	);
	const incoming = new Map<string, ServiceNodeTotals>();
	const ids = new Set<string>();
	const callers = new Set(dependencies.map(({ parent }) => parent));
	const pairs = new Set(
		dependencies.map(({ parent, child }) => `${parent}\u0000${child}`),
	);

	dependencies.forEach(({ parent, child, callCount, callRate, errorRate }) => {
		ids.add(parent);
		ids.add(child);

		const totals = incoming.get(child) ?? {
			callCount: 0,
			errorCount: 0,
			callRate: 0,
		};
		totals.callCount += callCount;
		totals.errorCount += (errorRate / 100) * callCount;
		totals.callRate += callRate;
		incoming.set(child, totals);
	});

	const links: ServiceMapLink[] = dependencies
		.map(({ parent, child, callCount, callRate, errorRate, p99 }) => ({
			source: parent,
			target: child,
			callCount,
			callRate,
			errorRate,
			p99,
			band: getHealthBand({ callCount, errorRate }),
			colorBand: getHealthBand({ callCount, errorRate }),
			isBidirectional: pairs.has(`${child}\u0000${parent}`),
		}))
		.sort(
			(a, b) => compareIds(a.source, b.source) || compareIds(a.target, b.target),
		);

	const worstIncoming = new Map<string, HealthBand>();
	links.forEach(({ target, band }) => {
		const current = worstIncoming.get(target);
		if (!current || BAND_SEVERITY[band] < BAND_SEVERITY[current]) {
			worstIncoming.set(target, band);
		}
	});

	const nodes: ServiceMapNode[] = [...ids].sort(compareIds).map((id) => {
		const totals = incoming.get(id) ?? {
			callCount: 0,
			errorCount: 0,
			callRate: 0,
		};
		const service = servicesByName.get(id);
		const metrics = service ? toMetrics(service) : undefined;
		const kind = getNodeKind(id, !!metrics, callers.has(id));

		return {
			id,
			metrics,
			incoming: {
				...totals,
				errorRate:
					totals.callCount > 0 ? (totals.errorCount / totals.callCount) * 100 : 0,
			},
			kind,
			band:
				kind === 'service'
					? getHealthBand(metrics)
					: (worstIncoming.get(id) ?? 'noData'),
			...previousPositions.get(id),
		};
	});

	const bandById = new Map(nodes.map((node) => [node.id, node.band]));
	links.forEach((link) => {
		const targetBand = bandById.get(link.target);
		if (
			targetBand &&
			isAlerting(targetBand) &&
			BAND_SEVERITY[targetBand] < BAND_SEVERITY[link.band]
		) {
			link.colorBand = targetBand;
		}
	});

	return { nodes, links };
};

export const getNodePositions = (
	nodes: readonly ServiceMapNode[],
): Map<string, Position> =>
	new Map(
		nodes
			.filter((node) => node.x !== undefined && node.y !== undefined)
			.map(({ id, x, y, vx, vy }) => [id, { x, y, vx, vy }]),
	);
