import type { ServiceMapGraph, ServiceMapNode } from '../types';
import { linkEndId } from './adjacency';

/** Planes of the 3D panorama, top to bottom. */
export const PANORAMA_TIERS = ['entry', 'internal', 'data'] as const;

export type PanoramaTier = (typeof PANORAMA_TIERS)[number];

/** Why the map put a node on its plane, for the panel to explain. */
export type TierReason =
	| { kind: 'dataStore' }
	| { kind: 'noCaller' }
	| { kind: 'calledBy'; caller: string; share?: number }
	/** Every service is called (a cycle): the one with the most outside traffic enters. */
	| { kind: 'cycle' };

export interface InferredTier {
	tier: PanoramaTier;
	reason: TierReason;
}

/** Calls under this share of a service's own calls (health checks, probes) do not make it internal. */
const CALLER_MIN_SHARE = 0.05;

/**
 * Databases, queues and external hosts sit on the data plane. A service is
 * where traffic enters unless another service makes a real share of its calls.
 */
export const getInferredTiers = (
	graph: Pick<ServiceMapGraph, 'nodes' | 'links'>,
): Map<string, InferredTier> => {
	const ownCalls = new Map(
		graph.nodes.map((node) => [node.id, node.metrics?.callCount]),
	);
	/** The caller with the largest share of each called service. */
	const mainCaller = new Map<string, { caller: string; calls: number }>();
	graph.links.forEach((link) => {
		const source = linkEndId(link.source);
		const target = linkEndId(link.target);
		const own = ownCalls.get(target);
		const counts =
			source !== target && (!own || link.callCount >= own * CALLER_MIN_SHARE);
		const current = mainCaller.get(target);
		if (counts && (!current || link.callCount > current.calls)) {
			mainCaller.set(target, { caller: source, calls: link.callCount });
		}
	});

	const tiers = new Map<string, InferredTier>();
	graph.nodes.forEach((node) => {
		const caller = mainCaller.get(node.id);
		const own = ownCalls.get(node.id);
		if (node.kind !== 'service') {
			tiers.set(node.id, { tier: 'data', reason: { kind: 'dataStore' } });
		} else if (caller) {
			tiers.set(node.id, {
				tier: 'internal',
				reason: {
					kind: 'calledBy',
					caller: caller.caller,
					share: own ? Math.min(1, caller.calls / own) : undefined,
				},
			});
		} else {
			tiers.set(node.id, { tier: 'entry', reason: { kind: 'noCaller' } });
		}
	});

	if (![...tiers.values()].some(({ tier }) => tier === 'entry')) {
		const outside = (node: ServiceMapNode): number =>
			(node.metrics?.callCount ?? 0) - node.incoming.callCount;
		const busiest = graph.nodes
			.filter((node) => tiers.get(node.id)?.tier === 'internal')
			.reduce<ServiceMapNode | undefined>(
				(best, node) => (!best || outside(node) > outside(best) ? node : best),
				undefined,
			);
		if (busiest) {
			tiers.set(busiest.id, { tier: 'entry', reason: { kind: 'cycle' } });
		}
	}
	return tiers;
};

export const getNodeTiers = (
	graph: Pick<ServiceMapGraph, 'nodes' | 'links'>,
): Map<string, PanoramaTier> =>
	new Map(
		[...getInferredTiers(graph)].map(([id, inferred]) => [id, inferred.tier]),
	);

export const isPanoramaTier = (value: unknown): value is PanoramaTier =>
	typeof value === 'string' &&
	(PANORAMA_TIERS as readonly string[]).includes(value);
