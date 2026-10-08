import type { Adjacency } from './adjacency';

export type FocusDirection = 'up' | 'down' | 'both';

export const FOCUS_DIRECTIONS: FocusDirection[] = ['up', 'down', 'both'];

/** Hop limits offered in the focus banner; `undefined` walks the whole graph. */
export const FOCUS_DEPTHS = [1, 2, 3] as const;

const walk = (
	start: string,
	next: ReadonlyMap<string, ReadonlySet<string>>,
	distances: Map<string, number>,
	maxDepth = Infinity,
): void => {
	let frontier = [start];
	let distance = 0;
	while (frontier.length > 0 && distance < maxDepth) {
		distance += 1;
		const following: string[] = [];
		frontier.forEach((id) => {
			next.get(id)?.forEach((neighbour) => {
				const known = distances.get(neighbour);
				if (known === undefined || known > distance) {
					distances.set(neighbour, distance);
					following.push(neighbour);
				}
			});
		});
		frontier = following;
	}
};

/**
 * Everything that depends on `root` directly or indirectly (up), everything it
 * depends on (down), or both, with the number of hops from `root`.
 */
export const getFocusSet = (
	adjacency: Adjacency,
	root: string,
	direction: FocusDirection,
	maxDepth?: number,
): Map<string, number> => {
	const distances = new Map<string, number>([[root, 0]]);
	if (direction !== 'down') {
		walk(root, adjacency.callers, distances, maxDepth);
	}
	if (direction !== 'up') {
		walk(root, adjacency.callees, distances, maxDepth);
	}
	return distances;
};

/** Names grouped by hops, closest first, as pasted into an incident channel. */
export const formatFocusList = (
	root: string,
	direction: FocusDirection,
	distances: ReadonlyMap<string, number>,
): string => {
	const byDistance = new Map<number, string[]>();
	distances.forEach((distance, id) => {
		if (id !== root) {
			byDistance.set(distance, [...(byDistance.get(distance) ?? []), id]);
		}
	});
	const verb = {
		up: 'depend on',
		down: 'are depended on by',
		both: 'are connected to',
	}[direction];
	const lines = [...byDistance.entries()]
		.sort(([a], [b]) => a - b)
		.map(
			([distance, ids]) =>
				`${distance} hop${distance > 1 ? 's' : ''}: ${ids.sort().join(', ')}`,
		);
	return [
		`Services that ${verb} ${root} (${distances.size - 1}):`,
		...lines,
	].join('\n');
};
