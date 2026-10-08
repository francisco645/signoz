import type { ServiceMapGraph } from '../types';
import { linkEndId } from './adjacency';

/** Planes of the 3D panorama, top to bottom. */
export const PANORAMA_TIERS = ['entry', 'internal', 'data'] as const;

export type PanoramaTier = (typeof PANORAMA_TIERS)[number];

/** Calls under this share of a service's own calls (health checks, probes) do not make it internal. */
const CALLER_MIN_SHARE = 0.05;

/**
 * Databases, queues and external hosts sit on the data plane. A service is
 * where traffic enters unless another service makes a real share of its calls.
 * With no such service (every service in a cycle), the one with the most
 * traffic from outside the map is the entry.
 */
export const getNodeTiers = (
	graph: Pick<ServiceMapGraph, 'nodes' | 'links'>,
): Map<string, PanoramaTier> => {
	const ownCalls = new Map(
		graph.nodes.map((node) => [node.id, node.metrics?.callCount]),
	);
	const called = new Set<string>();
	graph.links.forEach((link) => {
		const source = linkEndId(link.source);
		const target = linkEndId(link.target);
		const own = ownCalls.get(target);
		if (source !== target && (!own || link.callCount >= own * CALLER_MIN_SHARE)) {
			called.add(target);
		}
	});

	const tiers = new Map<string, PanoramaTier>();
	graph.nodes.forEach((node) => {
		if (node.kind !== 'service') {
			tiers.set(node.id, 'data');
		} else {
			tiers.set(node.id, called.has(node.id) ? 'internal' : 'entry');
		}
	});

	if (![...tiers.values()].includes('entry')) {
		const outside = (node: ServiceMapGraph['nodes'][number]): number =>
			(node.metrics?.callCount ?? 0) - node.incoming.callCount;
		const busiest = graph.nodes
			.filter((node) => tiers.get(node.id) === 'internal')
			.reduce<ServiceMapGraph['nodes'][number] | undefined>(
				(best, node) => (!best || outside(node) > outside(best) ? node : best),
				undefined,
			);
		if (busiest) {
			tiers.set(busiest.id, 'entry');
		}
	}
	return tiers;
};
