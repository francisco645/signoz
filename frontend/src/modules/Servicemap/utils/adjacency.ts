import type { ServiceMapLink } from '../types';

export interface Adjacency {
	callers: ReadonlyMap<string, ReadonlySet<string>>;
	callees: ReadonlyMap<string, ReadonlySet<string>>;
}

type LinkEnd = ServiceMapLink['source'] | { id?: string | number };

/** force-graph swaps a link's ends for the node objects once it lays them out. */
export const linkEndId = (end: LinkEnd): string =>
	typeof end === 'object' ? String(end.id) : end;

const addTo = (
	map: Map<string, Set<string>>,
	key: string,
	value: string,
): void => {
	const set = map.get(key) ?? new Set<string>();
	set.add(value);
	map.set(key, set);
};

export const buildAdjacency = (
	links: readonly Pick<ServiceMapLink, 'source' | 'target'>[],
): Adjacency => {
	const callers = new Map<string, Set<string>>();
	const callees = new Map<string, Set<string>>();

	links.forEach((link) => {
		const source = linkEndId(link.source);
		const target = linkEndId(link.target);
		addTo(callees, source, target);
		addTo(callers, target, source);
	});

	return { callers, callees };
};
