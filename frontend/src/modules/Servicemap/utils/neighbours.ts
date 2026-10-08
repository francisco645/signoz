import type { HealthBand, ServiceMapGraph } from '../types';
import { linkEndId } from './adjacency';

export type NeighbourDirection = 'callers' | 'callees';

export interface NeighbourRow {
	id: string;
	/** Band of the call between the two services, not of the neighbour. */
	band: HealthBand;
	callRate: number;
	callCount: number;
	errorRate: number;
	/** Nanoseconds, measured on the callee. */
	p99: number;
	/** Failed calls on the link: what "culprit or victim" is ranked by. */
	errorCount: number;
}

export const getNeighbours = (
	graph: ServiceMapGraph,
	id: string,
	direction: NeighbourDirection,
): NeighbourRow[] =>
	graph.links
		.filter((link) =>
			direction === 'callers'
				? linkEndId(link.target) === id
				: linkEndId(link.source) === id,
		)
		.map((link) => ({
			id: linkEndId(direction === 'callers' ? link.source : link.target),
			band: link.band,
			callRate: link.callRate,
			callCount: link.callCount,
			errorRate: link.errorRate,
			p99: link.p99,
			errorCount: (link.errorRate / 100) * link.callCount,
		}))
		.sort((a, b) => b.errorCount - a.errorCount || b.callRate - a.callRate);
