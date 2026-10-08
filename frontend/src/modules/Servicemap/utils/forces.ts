import type { NodeObject } from 'react-force-graph-2d';

/**
 * Pulls every node gently towards the centre, so services with no calls between
 * them stay in view instead of drifting apart and shrinking the fitted graph.
 */
export const createGravityForce = (
	strength: number,
): ((alpha: number) => void) & {
	initialize: (nodes: NodeObject[]) => void;
} => {
	let nodes: NodeObject[] = [];
	const force = (alpha: number): void => {
		nodes.forEach((node) => {
			node.vx = (node.vx ?? 0) - (node.x ?? 0) * strength * alpha;
			node.vy = (node.vy ?? 0) - (node.y ?? 0) * strength * alpha;
		});
	};
	force.initialize = (next: NodeObject[]): void => {
		nodes = next;
	};
	return force;
};
