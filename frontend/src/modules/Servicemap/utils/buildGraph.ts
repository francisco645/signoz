import type { ServicesList } from 'types/api/metrics/getService';
import type { ServiceMapDependency } from 'types/api/serviceMap/getDependencyGraph';

import type {
	ServiceMapGraph,
	ServiceMapLink,
	ServiceMapNode,
	ServiceMetrics,
} from '../types';
import { getHealthBand } from './health';

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
 * A node's health comes from the service's own spans (`services`). Databases,
 * queues and client-only services have none, so they are drawn as no data.
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

	const nodes: ServiceMapNode[] = [...ids].sort(compareIds).map((id) => {
		const totals = incoming.get(id) ?? {
			callCount: 0,
			errorCount: 0,
			callRate: 0,
		};
		const service = servicesByName.get(id);
		const metrics = service ? toMetrics(service) : undefined;

		return {
			id,
			metrics,
			incoming: {
				...totals,
				errorRate:
					totals.callCount > 0 ? (totals.errorCount / totals.callCount) * 100 : 0,
			},
			band: getHealthBand(metrics),
			...previousPositions.get(id),
		};
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
			isBidirectional: pairs.has(`${child}\u0000${parent}`),
		}))
		.sort(
			(a, b) => compareIds(a.source, b.source) || compareIds(a.target, b.target),
		);

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
